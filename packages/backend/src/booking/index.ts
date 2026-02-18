import { z } from "zod";
import { createZoomMeeting, deleteZoomMeeting, updateZoomMeeting } from "../zoom/meeting";
import { getGoogleService } from "../google/service";
import {
  getBookingById,
  getBookingByPaymentIntent,
  updateBookingStatus,
  updateBookingTime,
} from "@workspace/database";
import { createStripeService } from "../payment";
import { generateRescheduleToken, generateCancelToken } from "../lib/jwt";
import { sendEmail } from "../lib/resend";

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
  intentId: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().default("usd"),
});

const CreateBookingSchema = z.object({
  service: ServiceDataSchema,
  appointment: AppointmentDataSchema,
  client: ClientDataSchema,
  payment: PaymentDataSchema,
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

export async function createBooking(baseUrl: string, data: CreateBookingInput) {
  const validatedData = CreateBookingSchema.parse(data);

  // Idempotency guard: if this payment intent already created a booking, return it.
  const existing = await getBookingByPaymentIntent(validatedData.payment.intentId);
  if (existing) {
    return {
      success: true,
      data: {
        bookingId: existing.id,
        zoomMeetingId: existing.zoom_meeting_id,
        calendarEventId: existing.calendar_event_id,
        meetingUrl: "Already created",
        status: "ACCEPTED",
        startTime: existing.start_time,
      },
    };
  }

  let zoomMeetingId: string | undefined;
  let calendarEventId: string | undefined;

  try {
    const bookingId = crypto.randomUUID();
    const durationMinutes = parseDurationToMinutes(validatedData.service.duration);
    const startTime = new Date(validatedData.appointment.startTime);
    const endTime = validatedData.appointment.endTime
      ? new Date(validatedData.appointment.endTime)
      : new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    let zoomMeetingUrl = "";
    if (validatedData.appointment.format === "online") {
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
      if (zoomMeetingId) await deleteZoomMeeting(zoomMeetingId);
      throw new Error(calendarResult.error || "Failed to create calendar event");
    }
    calendarEventId = calendarResult.data.eventId;

    await sendEmail(
      [validatedData.client.email],
      "Booking Confirmation - Ruckus Systems",
      `<p>Your booking is confirmed.</p><p>Reschedule: ${rescheduleUrl}<br/>Cancel: ${cancelUrl}</p>`,
    );

    return {
      success: true,
      data: {
        bookingId,
        zoomMeetingId,
        calendarEventId,
        meetingUrl: zoomMeetingUrl,
        status: "ACCEPTED",
        startTime: validatedData.appointment.startTime,
        endTime: endTime.toISOString(),
        paymentIntentId: validatedData.payment.intentId,
        rescheduleUrl,
        cancelUrl,
      },
    };
  } catch (error) {
    if (zoomMeetingId) await deleteZoomMeeting(zoomMeetingId);
    if (calendarEventId) await getGoogleService().deleteCalendarEvent(calendarEventId);
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
