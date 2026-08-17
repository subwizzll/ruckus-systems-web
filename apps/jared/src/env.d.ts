/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_RUCKUS_BOOKING_API_URL?: string
  readonly PUBLIC_RUCKUS_API_KEY?: string
  readonly PUBLIC_RUCKUS_TENANT_SLUG?: string
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string
  readonly PUBLIC_BOOKING_ENABLED?: string
  readonly PUBLIC_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
