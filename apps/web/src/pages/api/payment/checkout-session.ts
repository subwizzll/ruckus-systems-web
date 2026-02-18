import type { APIRoute } from "astro";
import { createStripeService, type CreateCheckoutSessionInput } from "@workspace/backend/payment";

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

    const stripeService = createStripeService({
      secretKey: import.meta.env.STRIPE_SECRET_KEY,
      publishableKey: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
      apiVersion: import.meta.env.STRIPE_API_VERSION,
    });

    const checkoutData: CreateCheckoutSessionInput = {
      serviceId: bookingData.serviceId || "strategy-call",
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
