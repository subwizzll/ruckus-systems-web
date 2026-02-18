import type { APIRoute } from "astro";
import Stripe from "stripe";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount } = await request.json();

    const amountNum = Number(amount);
    if (!amountNum || amountNum < 1 || amountNum > 500) {
      return new Response(
        JSON.stringify({ success: false, error: "Amount must be between $1 and $500" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const secretKey = import.meta.env.STRIPE_SECRET_KEY;
    const apiVersion = import.meta.env.STRIPE_API_VERSION || "2025-07-30.basil";

    if (!secretKey) {
      throw new Error("Stripe configuration missing");
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: apiVersion as Stripe.LatestApiVersion,
    });

    const appUrl = import.meta.env.PUBLIC_APP_URL || "http://localhost:4321";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amountNum * 100),
            product_data: {
              name: "Buy Jared a Coffee",
              description: "Thanks for the support! Every cup keeps the automation engines running.",
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/?tip=thanks`,
      cancel_url: `${appUrl}/`,
      metadata: {
        tip_amount: String(Math.round(amountNum * 100)),
        source: "buy-me-a-coffee",
      },
    });

    return new Response(JSON.stringify({ success: true, url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create tip session",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
