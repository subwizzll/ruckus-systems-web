# Architecture

This repo is a **thin client** for the Ruckus multi-tenant booking platform. The Astro site renders portfolio content and embeds `BookingModal`; booking, payment, and calendar logic runs on central platform services.

## What lives where

| Concern | Where it runs |
|---------|----------------|
| Marketing site, `BookingModal` UI | `apps/web` |
| Slots, bookings, checkout, webhooks | [booking-api](https://booking.ruckussystems.dev) |
| Google / Zoom / Stripe Connect OAuth | [integration-portal](https://integration-portal.ruckussystems.dev) |
| Practitioner auth (`/api/auth/*`) | Local `@workspace/backend` (this repo only) |
| Tip payments (`/api/payment/tip`) | Local Stripe route (not part of central booking API) |
| Turnstile bot check (free bookings) | Client env (`TURNSTILE_*`) |

```mermaid
flowchart LR
  Web[apps/web] -->|PUBLIC_RUCKUS_*| API[booking-api]
  Web -->|STRIPE_SECRET_KEY| Tip[/api/payment/tip]
  Web -->|CLIENT_SECRET| Auth[@workspace/backend]
  API --> DB[(Neon)]
```

## Shared packages

Do **not** publish client UI packages to GitHub Packages. Shared code stays private and is consumed as bun workspaces.

| Package | How this repo gets it |
|---------|----------------------|
| `@ruckus/brand-styles` | workspace package in `packages/brand-styles` |
| `@ruckus-systems/scheduling-astro` | git submodule `packages/ruckus-integrations` (private) |
| `@ruckus-systems/scheduling-themes` | same submodule |

Root `package.json` workspaces include only the shared scheduling packages from the submodule (`packages/astro`, `packages/themes`, `packages/core`, `typescript-config`), not booking-api or the portal.

```bash
git submodule update --init --recursive packages/ruckus-integrations
bun install
```

Vercel Root Directory is `apps/web` / `apps/jared`. Each app's `vercel.json` cds to the monorepo root and runs `scripts/vercel-install.sh`, which clones the private submodule with `SUBMODULE_GITHUB_TOKEN` (falls back to `NPM_TOKEN`), then `bun install`. Do not use `GITHUB_TOKEN` (Vercel/GitHub reserve it). Grant the Vercel GitHub app access to `subwizzll/ruckus-integrations` to silence the checkout warning.

## Required env (booking)

```bash
PUBLIC_RUCKUS_BOOKING_API_URL=https://booking.ruckussystems.dev
PUBLIC_RUCKUS_TENANT_SLUG=ruckus-systems
PUBLIC_RUCKUS_API_KEY=...
PUBLIC_APP_URL=https://ruckussystems.dev
BOOKING_ENABLED=true
PUBLIC_TURNSTILE_SITE_KEY=...      # client-side eligible check
TURNSTILE_SECRET_KEY=...
```

## Deploy

Root `vercel.json` → `apps/web` with `scripts/vercel-install.sh` + `turbo build --filter=web`. Jared portfolio app (`apps/jared`) is a separate Vercel project; its `vercel.json` runs the same install script from the monorepo root.

## Local development

```bash
bun install
bun run dev
```

Tenant slug for this site: `ruckus-systems`. See [ruckus-integrations](https://github.com/subwizzll/ruckus-integrations) for platform provisioning.
