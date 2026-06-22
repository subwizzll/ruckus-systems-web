# AGENTS.md

## Cursor Cloud specific instructions

This is a **Bun + Turborepo** monorepo for the Ruckus Systems marketing + booking website. The only runnable app is `apps/web` (Astro v5 SSR, dev port **4321**); the rest are internal workspace packages (`@workspace/backend`, `@workspace/database`, `@workspace/ui`, plus shared config packages).

### Tooling
- Package manager is **Bun** (`bun@1.2.21`). The update script installs it if missing; it is on `PATH` as `bun`.
- Dependencies are installed by the startup update script (`bun install`). Standard scripts live in the root `package.json` and `turbo.json` — refer to those rather than duplicating commands here.

### Running / building (root commands)
- Dev server: `bun run dev` (Astro on http://localhost:4321). This is a persistent task.
- Build: `bun run build` (runs `astro check && astro build` for `web`).
- Lint: `bun run lint` — only `@workspace/ui` defines a `lint` script; the other packages have none, so this effectively lints the UI package.
- Type-check: `bun run check-types`.

### Non-obvious gotchas
- **`bun run check-types` currently fails** in `@workspace/database` with `Cannot find type definition file for 'minimatch'`. This is pre-existing: `@workspace/backend` declares the deprecated stub `@types/minimatch@^6.0.0` as a devDependency, which breaks `tsc`. It is unrelated to environment setup. `bun run build`/`astro check` is unaffected and passes.
- **`.env` lives at the repo root** (not in `apps/web`). Astro's `loadEnv` reads the monorepo root. Copy `.env.example` → `.env`. `.env` is gitignored.
- **External services are required for the full booking/auth/payment flow** and are NOT available by default: `DATABASE_URL` (Neon/Postgres, via `@neondatabase/serverless`), Stripe, a Google service account (Calendar), Zoom Server-to-Server OAuth, and Resend. Without them the marketing site and booking modal UI still render, but `/api/booking/slots` and `POST /api/booking` return HTTP 500 with clear messages (e.g. `Missing Google service-account env vars`, DB connection errors). The Cloudflare Turnstile values in `.env.example` are Cloudflare's always-pass test keys.
- `BOOKING_ENABLED` / `PUBLIC_BOOKING_ENABLED` toggle the booking feature; set them to `false` to run the marketing site without DB/SaaS.
- **Dev-only email previews**: `GET /api/dev/booking-email-preview` (and `cancel-`/`reschedule-` variants) render the confirmation email HTML via `@workspace/backend` without calling Resend. These routes are disabled in production builds — handy for verifying backend rendering locally.
- DB migrations run via `bun run db:migrate` (`node-pg-migrate`, needs `DATABASE_URL`); seed an admin with `bun run seed:admin`.
- The `packages/shared-booking` git submodule points at a local absolute path that does not exist here and is unused by the build — do not try to initialize it.
