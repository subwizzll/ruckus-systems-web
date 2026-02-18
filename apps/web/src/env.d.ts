/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BOOKING_ENABLED?: string;
  readonly DATABASE_URL?: string;
  readonly CLIENT_SECRET?: string;
  readonly PUBLIC_APP_URL?: string;
  readonly PUBLIC_BOOKING_ENABLED?: string;
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  readonly STRIPE_SECRET_KEY?: string;
  readonly STRIPE_WEBHOOK_SECRET?: string;
  readonly STRIPE_API_VERSION?: string;
  readonly RESEND_API_KEY?: string;
  readonly GOOGLE_CLIENT_EMAIL?: string;
  readonly GOOGLE_PRIVATE_KEY?: string;
  readonly GOOGLE_SUBJECT_EMAIL?: string;
  readonly ZOOM_ACCOUNT_ID?: string;
  readonly ZOOM_CLIENT_ID?: string;
  readonly ZOOM_CLIENT_SECRET?: string;
}
