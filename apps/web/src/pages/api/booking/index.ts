import type { APIRoute } from "astro";
import {
  createBooking,
  type CreateBookingInput,
  saveBooking,
  generateRescheduleToken,
  generateCancelToken,
} from "@workspace/backend";

function isBookingEnabled() {
  return process.env.BOOKING_ENABLED !== "false";
}

function parseDurationToMinutes(duration?: string): number {
  if (!duration) return 60;
  const match = duration.match(/(\d+)\s*(min|minute|hour|hr)/i);
  if (!match) return 60;
  const value = parseInt(match[1] || "60", 10);
  return (match[2] || "").toLowerCase().startsWith("h") ? value * 60 : value;
}

export const POST: APIRoute = async ({ url, request }) => {
  try {
    if (!isBookingEnabled()) {
      return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bookingData = await request.json();
    const createBookingData: CreateBookingInput = {
      service: {
        id: bookingData.service?.id || "strategy-call",
        title: bookingData.service?.title || "Strategy Call",
        duration: bookingData.service?.duration || "60 minutes",
        price: bookingData.service?.price || "$250",
      },
      appointment: {
        startTime: bookingData.appointment?.startTime || "",
        endTime: bookingData.appointment?.endTime,
        timezone: bookingData.appointment?.timezone || "UTC",
        format: bookingData.appointment?.format === "in-person" ? "in-person" : "online",
      },
      client: {
        firstName: bookingData.client?.firstName || "",
        lastName: bookingData.client?.lastName || "",
        email: bookingData.client?.email || "",
        phone: bookingData.client?.phone || "",
        notes: bookingData.client?.notes || "",
      },
      payment: {
        intentId: bookingData.payment?.intentId || "missing-intent-id",
        amount: bookingData.payment?.amount || 25000,
        currency: bookingData.payment?.currency || "usd",
      },
    };

    if (!createBookingData.appointment.startTime) throw new Error("Start time is required");
    if (!createBookingData.client.email) throw new Error("Client email is required");
    if (!createBookingData.client.firstName || !createBookingData.client.lastName) {
      throw new Error("Client name is required");
    }

    const result = await createBooking(url.origin, createBookingData);
    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to create booking");
    }

    const durationMinutes = parseDurationToMinutes(createBookingData.service.duration);
    const savedBooking = await saveBooking({
      id: result.data.bookingId,
      zoomMeetingId: result.data.zoomMeetingId,
      calendarEventId: result.data.calendarEventId,
      clientFirstName: createBookingData.client.firstName,
      clientLastName: createBookingData.client.lastName,
      clientEmail: createBookingData.client.email,
      clientPhone: createBookingData.client.phone,
      serviceId: createBookingData.service.id,
      serviceTitle: createBookingData.service.title,
      startTime: new Date(createBookingData.appointment.startTime),
      durationMinutes,
      timezone: createBookingData.appointment.timezone,
      format: createBookingData.appointment.format,
      stripePaymentIntentId: createBookingData.payment.intentId,
      amount: createBookingData.payment.amount,
      currency: createBookingData.payment.currency,
      status: "confirmed",
      notes: createBookingData.client.notes,
    });

    const eventStartTime = new Date(createBookingData.appointment.startTime);
    const rescheduleToken = generateRescheduleToken(
      savedBooking.id,
      createBookingData.client.email,
      eventStartTime,
    );
    const cancelToken = generateCancelToken(
      savedBooking.id,
      createBookingData.client.email,
      eventStartTime,
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result.data,
          rescheduleUrl: `${url.origin}/reschedule?token=${rescheduleToken}`,
          cancelUrl: `${url.origin}/cancel?token=${cancelToken}`,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create booking",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
