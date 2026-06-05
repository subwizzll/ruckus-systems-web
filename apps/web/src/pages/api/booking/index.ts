import type { APIRoute } from "astro";
import {
  createBooking,
  type CreateBookingInput,
  generateRescheduleToken,
  generateCancelToken,
} from "@workspace/backend";
import { getPublicSiteOrigin } from   "@/lib/public-site-origin";

import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'
const services: CollectionEntry<'services'>[] = await getCollection('services')



function isBookingEnabled() {
  return process.env.BOOKING_ENABLED !== "false";
}

function getServiceBookingWindow(serviceId: string): { minDaysInAdvance: number; maxDaysInAdvance: number } {
  const service = services.find((s: CollectionEntry<'services'>) => s.data.id === serviceId)?.data;
  return {
    minDaysInAdvance: service?.minDaysInAdvance ?? 1,
    maxDaysInAdvance: service?.maxDaysInAdvance ?? 30,
  };
}

function isStartTimeWithinBookingWindow(
  startTime: string,
  minDaysInAdvance: number,
  maxDaysInAdvance: number,
): boolean {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const minStart = new Date(todayUtc);
  minStart.setUTCDate(minStart.getUTCDate() + minDaysInAdvance);
  const maxEnd = new Date(todayUtc);
  maxEnd.setUTCDate(maxEnd.getUTCDate() + Math.max(maxDaysInAdvance, minDaysInAdvance));
  maxEnd.setUTCHours(23, 59, 59, 999);
  const start = new Date(startTime);
  return start >= minStart && start <= maxEnd;
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
    const serviceId = bookingData.service?.id || "strategy-call";
    const service = services.find((s: CollectionEntry<'services'>) => s.data.id === serviceId)?.data;
    const isFree = service ? service.amount === 0 : false;

    const createBookingData: CreateBookingInput = {
      service: {
        id: serviceId,
        title: bookingData.service?.title || "Strategy Call",
        duration: bookingData.service?.duration ?? 60,
        price: service ? (service.amount <= 0 ? "FREE" : `$${Math.floor(service.amount / 100)}`) : "$0",
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
      ...(isFree
        ? {}
        : {
            payment: {
              intentId: bookingData.payment?.intentId || "missing-intent-id",
              amount: bookingData.payment?.amount || 25000,
              currency: bookingData.payment?.currency || "usd",
            },
          }),
    };

    if (!createBookingData.appointment.startTime) throw new Error("Start time is required");
    if (!createBookingData.client.email) throw new Error("Client email is required");
    if (!createBookingData.client.firstName || !createBookingData.client.lastName) {
      throw new Error("Client name is required");
    }

    const { minDaysInAdvance, maxDaysInAdvance } = getServiceBookingWindow(serviceId);
    if (
      !isStartTimeWithinBookingWindow(
        createBookingData.appointment.startTime,
        minDaysInAdvance,
        maxDaysInAdvance,
      )
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Appointment must be between ${minDaysInAdvance} and ${maxDaysInAdvance} days from today.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const siteOrigin = getPublicSiteOrigin(request, url);
    const result = await createBooking(siteOrigin, createBookingData);
    if (!result.success || !result.data) {
      const message = result.error || "Failed to create booking";
      const isDuplicateFree =
        isFree && message.includes("already used your free strategy session");
      return new Response(
        JSON.stringify({ success: false, error: message, message }),
        {
          status: isDuplicateFree ? 409 : 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const eventStartTime = new Date(createBookingData.appointment.startTime);
    const rescheduleToken = generateRescheduleToken(
      result.data.bookingId,
      createBookingData.client.email,
      eventStartTime,
    );
    const cancelToken = generateCancelToken(
      result.data.bookingId,
      createBookingData.client.email,
      eventStartTime,
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result.data,
          rescheduleUrl: `${siteOrigin}/reschedule?token=${rescheduleToken}`,
          cancelUrl: `${siteOrigin}/cancel?token=${cancelToken}`,
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
