import { z } from "zod";
import { createZoomMeeting, deleteZoomMeeting, updateZoomMeeting } from "../zoom/meeting";
import { getGoogleService } from "../google/service";
import {
  getBookingById,
  getBookingByPaymentIntent,
  getFreeBookingByEmail,
  saveBooking,
  confirmBooking,
  updateProvisioning,
  deletePendingBooking,
  updateBookingStatus,
  updateBookingTime,
  isUniqueViolation,
  type Booking,
} from "@workspace/database";
import { createStripeService } from "../payment";
import { generateRescheduleToken, generateCancelToken } from "../lib/jwt";
import { sendEmail } from "../lib/resend";
import {
  BOOKING_CONFIRMATION_EMAIL_SUBJECT,
  buildBookingConfirmationEmailHtml,
} from "../emails/booking-confirmation";

const ServiceDataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  duration: z.union([z.number().int().min(1), z.string()]).optional(),
  price: z.string().optional(),
});

const AppointmentDataSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().optional(),
  timezone: z.string().min(1),
  format: z.enum(["online", "in-person"]).default("online"),
});

const ClientDataSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  notes: z.string().optional(),
});

const PaymentDataSchema = z.object({
  intentId: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string().default("usd"),
});

const CreateBookingSchema = z.object({
  service: ServiceDataSchema,
  appointment: AppointmentDataSchema,
  client: ClientDataSchema,
  payment: PaymentDataSchema.optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

function parseDurationToMinutes(duration?: string | number): number {
  if (typeof duration === "number") return duration;
  if (!duration) return 60;
  const match = duration.match(/(\d+)\s*(min|minute|hour|hr)/i);
  if (!match) return 60;
  const value = parseInt(match[1] || "60", 10);
  return (match[2] || "").toLowerCase().startsWith("h") ? value * 60 : value;
}

function bookingToResponseData(
  booking: Booking,
  extras: {
    meetingUrl: string;
    endTime: string;
    isFree: boolean;
    rescheduleUrl: string;
    cancelUrl: string;
    emailSent?: boolean;
    emailError?: string;
  },
) {
  return {
    bookingId: booking.id,
    zoomMeetingId: booking.zoom_meeting_id,
    calendarEventId: booking.calendar_event_id,
    meetingUrl: extras.meetingUrl,
    status: "ACCEPTED",
    startTime: booking.start_time,
    endTime: extras.endTime,
    paymentIntentId: booking.stripe_payment_intent_id,
    isFree: extras.isFree,
    rescheduleUrl: extras.rescheduleUrl,
    cancelUrl: extras.cancelUrl,
    emailSent: extras.emailSent,
    ...(extras.emailError !== undefined ? { emailError: extras.emailError } : {}),
  };
}

function isProvisioningComplete(booking: Booking): boolean {
  if (booking.status === "confirmed" && booking.calendar_event_id) return true;
  if (booking.format === "in-person" && booking.status === "confirmed") return true;
  return false;
}

export async function createBooking(baseUrl: string, data: CreateBookingInput) {
  const validatedData = CreateBookingSchema.parse(data);
  const isFree = !validatedData.payment || validatedData.payment.amount === 0;
  const clientEmail = validatedData.client.email.toLowerCase();
  const durationMinutes = parseDurationToMinutes(validatedData.service.duration);
  const startTime = new Date(validatedData.appointment.startTime);
  const endTime = validatedData.appointment.endTime
    ? new Date(validatedData.appointment.endTime)
    : new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  if (!isFree && validatedData.payment?.intentId) {
    const existing = await getBookingByPaymentIntent(validatedData.payment.intentId);
    if (existing && isProvisioningComplete(existing)) {
      const rescheduleUrl = `${baseUrl}/reschedule?token=${generateRescheduleToken(
        existing.id,
        validatedData.client.email,
        new Date(existing.start_time),
      )}`;
      const cancelUrl = `${baseUrl}/cancel?token=${generateCancelToken(
        existing.id,
        validatedData.client.email,
        new Date(existing.start_time),
      )}`;
      return {
        success: true,
        data: bookingToResponseData(existing, {
          meetingUrl: "Already created",
          endTime: endTime.toISOString(),
          isFree,
          rescheduleUrl,
          cancelUrl,
        }),
      };
    }
  }

  if (isFree) {
    const existingFree = await getFreeBookingByEmail(clientEmail, validatedData.service.id);
    if (existingFree && isProvisioningComplete(existingFree)) {
      return {
        success: false,
        error: "You've already used your free strategy session. Please select a paid service.",
      };
    }
  }

  let zoomMeetingId: string | undefined;
  let calendarEventId: string | undefined;
  let bookingId: string | undefined;
  let createdPendingThisRun = false;
  let createdZoomThisRun = false;
  let createdCalendarThisRun = false;

  try {
    if (!isFree && validatedData.payment?.intentId) {
      const inFlight = await getBookingByPaymentIntent(validatedData.payment.intentId);
      if (inFlight) {
        bookingId = inFlight.id;
        zoomMeetingId = inFlight.zoom_meeting_id;
        calendarEventId = inFlight.calendar_event_id;
      }
    }

    if (isFree && !bookingId) {
      const inFlightFree = await getFreeBookingByEmail(clientEmail, validatedData.service.id);
      if (inFlightFree) {
        bookingId = inFlightFree.id;
        zoomMeetingId = inFlightFree.zoom_meeting_id;
        calendarEventId = inFlightFree.calendar_event_id;
      }
    }

    if (!bookingId) {
      bookingId = crypto.randomUUID();
      try {
        await saveBooking({
          id: bookingId,
          clientFirstName: validatedData.client.firstName,
          clientLastName: validatedData.client.lastName,
          clientEmail,
          clientPhone: validatedData.client.phone,
          serviceId: validatedData.service.id,
          serviceTitle: validatedData.service.title,
          startTime,
          durationMinutes,
          timezone: validatedData.appointment.timezone,
          format: validatedData.appointment.format,
          stripePaymentIntentId: validatedData.payment?.intentId,
          amount: isFree ? 0 : (validatedData.payment?.amount ?? 0),
          currency: validatedData.payment?.currency || "usd",
          status: "pending",
          notes: validatedData.client.notes,
        });
        createdPendingThisRun = true;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;

        if (!isFree && validatedData.payment?.intentId) {
          const existing = await getBookingByPaymentIntent(validatedData.payment.intentId);
          if (!existing) throw error;
          bookingId = existing.id;
          zoomMeetingId = existing.zoom_meeting_id;
          calendarEventId = existing.calendar_event_id;
        } else if (isFree) {
          const existing = await getFreeBookingByEmail(clientEmail, validatedData.service.id);
          if (!existing) throw error;
          bookingId = existing.id;
          zoomMeetingId = existing.zoom_meeting_id;
          calendarEventId = existing.calendar_event_id;
        } else {
          throw error;
        }
      }
    }

    const currentBooking = await getBookingById(bookingId);
    if (currentBooking && isProvisioningComplete(currentBooking)) {
      const rescheduleUrl = `${baseUrl}/reschedule?token=${generateRescheduleToken(
        currentBooking.id,
        validatedData.client.email,
        new Date(currentBooking.start_time),
      )}`;
      const cancelUrl = `${baseUrl}/cancel?token=${generateCancelToken(
        currentBooking.id,
        validatedData.client.email,
        new Date(currentBooking.start_time),
      )}`;
      return {
        success: true,
        data: bookingToResponseData(currentBooking, {
          meetingUrl: "Already created",
          endTime: endTime.toISOString(),
          isFree,
          rescheduleUrl,
          cancelUrl,
        }),
      };
    }

    let zoomMeetingUrl = "";
    if (validatedData.appointment.format === "online" && !zoomMeetingId) {
      const zoomResult = await createZoomMeeting({
        topic: validatedData.service.title,
        type: "2",
        start_time: startTime.toISOString(),
        duration: durationMinutes,
        timezone: validatedData.appointment.timezone,
        agenda: `Session with ${validatedData.client.firstName} ${validatedData.client.lastName}`,
      });
      if (!zoomResult.success || !zoomResult.data) {
        throw new Error(zoomResult.error || "Failed to create Zoom meeting");
      }
      zoomMeetingId = zoomResult.data.meetingId;
      zoomMeetingUrl = zoomResult.data.joinUrl;
      createdZoomThisRun = true;
      await updateProvisioning(bookingId, { zoomMeetingId });
    }

    const rescheduleUrl = `${baseUrl}/reschedule?token=${generateRescheduleToken(
      bookingId,
      validatedData.client.email,
      startTime,
    )}`;
    const cancelUrl = `${baseUrl}/cancel?token=${generateCancelToken(
      bookingId,
      validatedData.client.email,
      startTime,
    )}`;

    if (!calendarEventId) {
      const calendarResult = await getGoogleService().createCalendarEvent({
        summary: validatedData.service.title,
        description: `${validatedData.service.title}\n\nReschedule: ${rescheduleUrl}\nCancel: ${cancelUrl}`,
        startTime,
        endTime,
        attendeeEmail: validatedData.client.email,
        attendeeName: `${validatedData.client.firstName} ${validatedData.client.lastName}`,
        timezone: validatedData.appointment.timezone,
        zoomMeetingUrl,
      });
      if (!calendarResult.success || !calendarResult.data) {
        throw new Error(calendarResult.error || "Failed to create calendar event");
      }
      calendarEventId = calendarResult.data.eventId;
      createdCalendarThisRun = true;
      await updateProvisioning(bookingId, { calendarEventId });
    }

    const confirmedBooking = await confirmBooking(bookingId, {
      zoomMeetingId,
      calendarEventId,
    });

    const emailResult = await sendEmail(
      [validatedData.client.email],
      BOOKING_CONFIRMATION_EMAIL_SUBJECT,
      buildBookingConfirmationEmailHtml({
        clientFirstName: validatedData.client.firstName,
        serviceTitle: validatedData.service.title,
        rescheduleUrl,
        cancelUrl,
      }),
    );

    let emailSent = true;
    let emailError: string | undefined;
    if (!emailResult.success) {
      emailSent = false;
      emailError =
        typeof emailResult.error === "string"
          ? emailResult.error
          : JSON.stringify(emailResult.error ?? "unknown");
      console.error("[createBooking] confirmation email failed:", emailError);
    }

    return {
      success: true,
      data: bookingToResponseData(confirmedBooking, {
        meetingUrl: zoomMeetingUrl,
        endTime: endTime.toISOString(),
        isFree,
        rescheduleUrl,
        cancelUrl,
        emailSent,
        ...(emailError !== undefined ? { emailError } : {}),
      }),
    };
  } catch (error) {
    if (createdZoomThisRun && zoomMeetingId) await deleteZoomMeeting(zoomMeetingId);
    if (createdCalendarThisRun && calendarEventId) {
      await getGoogleService().deleteCalendarEvent(calendarEventId);
    }
    if (createdPendingThisRun && bookingId) await deletePendingBooking(bookingId);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create booking" };
  }
}

export async function rescheduleBooking(bookingId: string, newStartTime: Date) {
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) throw new Error("Booking not found");
    const newEndTime = new Date(newStartTime.getTime() + booking.duration_minutes * 60 * 1000);

    if (booking.format === "online" && booking.zoom_meeting_id) {
      const zoomResult = await updateZoomMeeting(booking.zoom_meeting_id, {
        start_time: newStartTime.toISOString(),
        duration: booking.duration_minutes,
        timezone: booking.timezone,
      });
      if (!zoomResult.success) throw new Error(zoomResult.error || "Failed updating Zoom");
    }

    if (booking.calendar_event_id) {
      const cal = await getGoogleService().updateCalendarEvent(booking.calendar_event_id, {
        startTime: newStartTime,
        endTime: newEndTime,
      });
      if (!cal.success) throw new Error(cal.error || "Failed updating calendar");
    }

    await updateBookingTime(bookingId, newStartTime, booking.duration_minutes);
    return { success: true, data: { bookingId, newStartTime: newStartTime.toISOString() } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to reschedule booking" };
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) throw new Error("Booking not found");

    const now = new Date();
    const startTime = new Date(booking.start_time);
    const hoursUntilAppointment = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    let refunded = false;
    let refundAmount = 0;

    if (hoursUntilAppointment > 24 && booking.stripe_payment_intent_id) {
      const stripeService = createStripeService();
      const refundResult = await stripeService.refundPayment(
        booking.stripe_payment_intent_id,
        booking.amount,
        "requested_by_customer",
      );
      if (refundResult.success && refundResult.data) {
        refunded = true;
        refundAmount = refundResult.data.amount;
      }
    }

    if (booking.format === "online" && booking.zoom_meeting_id) {
      await deleteZoomMeeting(booking.zoom_meeting_id);
    }
    if (booking.calendar_event_id) {
      await getGoogleService().deleteCalendarEvent(booking.calendar_event_id);
    }
    await updateBookingStatus(bookingId, "cancelled");

    return { success: true, data: { refunded, refundAmount: refunded ? refundAmount : undefined } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to cancel booking" };
  }
}

export { CreateBookingSchema };
