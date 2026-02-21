import Stripe from "stripe";
import { z } from "zod";

const StripeConfigSchema = z.object({
  secretKey: z.string().min(1),
  publishableKey: z.string().min(1),
  apiVersion: z.string().optional().default("2025-07-30.basil"),
});

const CreateCheckoutSessionSchema = z.object({
  serviceId: z.string().min(1),
  amount: z.number().int().min(1),
  serviceName: z.string().min(1),
  serviceDescription: z.string().optional(),
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  schedulingInfo: z.object({
    startTime: z.string().min(1),
    timezone: z.string().min(1),
  }),
  metadata: z.record(z.string()).optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;

export class StripeService {
  private stripe: Stripe;

  constructor(config: { secretKey: string; publishableKey: string; apiVersion?: string }) {
    const parsed = StripeConfigSchema.parse(config);
    this.stripe = new Stripe(parsed.secretKey, {
      apiVersion: parsed.apiVersion as Stripe.LatestApiVersion,
      typescript: true,
    });
  }

  async createCheckoutSession(data: CreateCheckoutSessionInput) {
    const validatedData = CreateCheckoutSessionSchema.parse(data);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: validatedData.amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        receipt_email: validatedData.customerInfo.email,
        description: `${validatedData.serviceName} - ${validatedData.customerInfo.name}`,
        metadata: {
          service_id: validatedData.serviceId,
          service_name: validatedData.serviceName,
          customer_name: validatedData.customerInfo.name,
          customer_email: validatedData.customerInfo.email,
          customer_phone: validatedData.customerInfo.phone || "",
          start_time: validatedData.schedulingInfo.startTime,
          timezone: validatedData.schedulingInfo.timezone,
          booking_source: "website",
          ...validatedData.metadata,
        },
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: validatedData.amount,
          currency: "usd",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payment intent",
      };
    }
  }

  validateWebhookSignature(payload: string, signature: string, secret: string): Stripe.Event | null {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch {
      return null;
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as Stripe.RefundCreateParams.Reason | undefined,
      });
      return {
        success: true,
        data: {
          refundId: refund.id,
          amount: refund.amount || 0,
          status: refund.status || "pending",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process refund",
      };
    }
  }
}

export function createStripeService(config?: {
  secretKey?: string;
  publishableKey?: string;
  apiVersion?: string;
}) {
  return new StripeService({
    secretKey: config?.secretKey || import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "",
    publishableKey:
      config?.publishableKey ||
      import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      "",
    apiVersion:
      config?.apiVersion ||
      import.meta.env.STRIPE_API_VERSION ||
      process.env.STRIPE_API_VERSION ||
      "2025-07-30.basil",
  });
}
