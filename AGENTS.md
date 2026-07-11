# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Bun + Turborepo monorepo for the **Ruckus Systems** portfolio site. The only runnable
app is the Astro web app in `apps/web` (SSR, `@astrojs/vercel` adapter), backed by
workspace packages: `@workspace/backend` (booking, Stripe, Google Calendar, Zoom,
Resend), `@workspace/database` (Neon serverless + `node-pg-migrate`), and `@workspace/ui`.

### Runtime / tooling
- Uses **Bun** (see `packageManager` in `package.json`). The cloud VM installs Bun to
  `~/.local/bin` (on `PATH` via `~/.bashrc`). `nvm`'s Node is still the default `node`.
- Standard commands (run from repo root; see `package.json` scripts):
  - Dev server: `bun run dev` → Astro on `http://localhost:4321` (persistent; run in tmux).
  - Build: `bun run build` (the `web` build runs `astro check` first, so it also type-checks `.astro` files).
  - Lint: `bun run lint` (only `@workspace/ui` defines a `lint` task; others are no-ops).

### Known gotchas
- `bun run check-types` fails in `@workspace/database` with
  `Cannot find type definition file for 'minimatch'`. This is a pre-existing repo issue
  (unrelated to environment setup); `bun run build` still succeeds.
- `bun install` may rewrite `bun.lock` because the installed Bun (1.3.x) is newer than the
  pinned `packageManager` (1.2.21). This local churn is harmless; do not commit it.
- The `packages/shared-booking` git submodule points at a local absolute path that does not
  exist in CI/cloud and is empty. Nothing in the code imports it; ignore it (do not try to
  `git submodule update`).

### Environment variables / external services
- Copy `.env.example` to `.env` at the repo root (gitignored). The Astro config loads root
  `.env` into `process.env` for SSR backend code.
- The booking feature depends on external services with no working placeholder values:
  - `DATABASE_URL` must be a **Neon** HTTP connection string (the DB layer uses
    `@neondatabase/serverless`, not a plain local Postgres socket). Migrations: `bun run db:migrate`.
  - Stripe, Google Calendar (service account), Zoom, Resend, Cloudflare Turnstile keys.
- Without those secrets the static site and most UI work, and the booking confirmation /
  cancel / reschedule **email templates render via dev-only routes**
  (`/api/dev/booking-email-preview`, `/api/dev/cancel-email-preview`,
  `/api/dev/reschedule-email-preview`) — useful for verifying `@workspace/backend` end-to-end.
  Live availability (`/api/booking/slots`) and booking creation will error until real
  Google/Stripe/DB credentials are provided.
