import type { APIRoute } from "astro";
import { createStripeService } from "@workspace/backend/payment";
import { createBooking } from "@workspace/backend";
import { getPublicSiteOrigin } from "@/lib/public-site-origin";

export const POST: APIRoute = async ({ request, url }) => {
  try {
    if (process.env.BOOKING_ENABLED === "false") {
      return new Response(JSON.stringify({ success: false, error: "Booking is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ success: false, error: "Missing Stripe signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!import.meta.env.STRIPE_SECRET_KEY || !import.meta.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe configuration missing");
    }

    const stripeService = createStripeService({
      secretKey: import.meta.env.STRIPE_SECRET_KEY,
      publishableKey: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      apiVersion: import.meta.env.STRIPE_API_VERSION,
    });
    const event = stripeService.validateWebhookSignature(
      body,
      signature,
      import.meta.env.STRIPE_WEBHOOK_SECRET,
    );
    if (!event) {
      return new Response(JSON.stringify({ success: false, error: "Invalid webhook signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      const metadata = paymentIntent.metadata || {};
      const siteOrigin = getPublicSiteOrigin(request, url);
      await createBooking(siteOrigin, {
        service: {
          id: metadata.service_id || "strategy-call",
          title: metadata.service_name || "Strategy Call",
          duration: metadata.service_duration || "60 minutes",
          price: metadata.service_price || "$0",
        },
        appointment: {
          startTime: metadata.start_time || "",
          timezone: metadata.timezone || "UTC",
          format: metadata.format === "in-person" ? "in-person" : "online",
        },
        client: {
          firstName: metadata.first_name || (metadata.customer_name || "Client").split(" ")[0],
          lastName: metadata.last_name || (metadata.customer_name || "").split(" ").slice(1).join(" "),
          email: metadata.customer_email || "",
          phone: metadata.customer_phone || "",
          notes: metadata.notes || "",
        },
        payment: {
          intentId: paymentIntent.id,
          amount: paymentIntent.amount || 0,
          currency: paymentIntent.currency || "usd",
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
