import type { APIRoute } from "astro";
import { createStripeService, type CreateCheckoutSessionInput } from "@workspace/backend/payment";
import { getCollection } from 'astro:content'

import type { CollectionEntry } from 'astro:content'

const services: CollectionEntry<'services'>[] = await getCollection('services')

export const POST: APIRoute = async ({ request }) => {
  try {
    if (process.env.BOOKING_ENABLED === "false") {
      return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bookingData = await request.json();
    if (!import.meta.env.STRIPE_SECRET_KEY || !import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error("Stripe configuration missing");
    }

    const serviceId = bookingData.serviceId || null;
    const service = services.find((s: CollectionEntry<'services'>) => s.data.id === serviceId).data;
    if (!service) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown service: ${serviceId}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (service.amount === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Free services do not require payment" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const stripeService = createStripeService({
      secretKey: import.meta.env.STRIPE_SECRET_KEY,
      publishableKey: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
      apiVersion: import.meta.env.STRIPE_API_VERSION,
    });

    const checkoutData: CreateCheckoutSessionInput = {
      serviceId: service.id,
      amount: service.amount,
      serviceName: service.title,
      serviceDescription: service.description,
      customerInfo: {
        name:
          bookingData.customerInfo?.name ||
          `${bookingData.customerInfo?.firstName || ""} ${bookingData.customerInfo?.lastName || ""}`.trim(),
        email: bookingData.customerInfo?.email || "",
        phone: bookingData.customerInfo?.phone,
      },
      schedulingInfo: {
        startTime: bookingData.schedulingInfo?.startTime || "",
        timezone: bookingData.schedulingInfo?.timezone || "UTC",
      },
      metadata: {
        ...bookingData.metadata,
        booking_source: "website",
        format: bookingData.metadata?.format || "online",
      },
    };

    const result = await stripeService.createCheckoutSession(checkoutData);
    if (!result.success) throw new Error(result.error || "Failed to create checkout session");

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create checkout session",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
