import type { APIRoute } from "astro";
import { validateBookingToken, getBookingById, cancelBooking } from "@workspace/backend";

export const GET: APIRoute = async ({ url }) => {
  try {
    if (process.env.BOOKING_ENABLED === "false") {
      return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing token parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validation = validateBookingToken(token, "cancel");
    if (!validation.valid || !validation.payload) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error || "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const booking = await getBookingById(validation.payload.bookingId);
    if (!booking) {
      return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (booking.client_email !== validation.payload.email) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const startTime = new Date(booking.start_time);
    if (startTime.getTime() <= now.getTime()) {
      return new Response(
        JSON.stringify({ success: false, error: "Appointment has already started" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const hoursUntilAppointment = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const eligibleForRefund = hoursUntilAppointment > 24;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bookingId: booking.id,
          serviceTitle: booking.service_title,
          startTime: booking.start_time,
          format: booking.format,
          clientName: `${booking.client_first_name} ${booking.client_last_name}`,
          amount: booking.amount,
          currency: booking.currency,
          eligibleForRefund,
          hoursUntilAppointment: Math.round(hoursUntilAppointment * 10) / 10,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to validate token",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (process.env.BOOKING_ENABLED === "false") {
      return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { token, confirmed } = body;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!confirmed) {
      return new Response(
        JSON.stringify({ success: false, error: "Cancellation must be confirmed" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const validation = validateBookingToken(token, "cancel");
    if (!validation.valid || !validation.payload) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error || "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const booking = await getBookingById(validation.payload.bookingId);
    if (!booking) {
      return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (booking.client_email !== validation.payload.email) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (booking.status === "cancelled") {
      return new Response(JSON.stringify({ success: false, error: "Booking is already cancelled" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const startTime = new Date(booking.start_time);
    if (startTime.getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ success: false, error: "Appointment has already started" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await cancelBooking(validation.payload.bookingId);
    if (!result.success) throw new Error(result.error || "Failed to cancel booking");

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to cancel booking",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
