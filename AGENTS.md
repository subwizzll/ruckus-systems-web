# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Ruckus Systems is a **Turborepo monorepo** for a consulting/portfolio website built with **Astro 5 (SSR)** and **Bun**. The single runnable app is `apps/web` (Astro dev server on port 4321). Backend logic (`packages/backend`) and database layer (`packages/database`) are consumed as workspace packages — there is no separate backend server.

### Standard dev commands

See `README.md` and root `package.json` scripts. Quick reference:

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server | `bun run dev` (or `cd apps/web && bunx astro dev`) |
| Build | `bun run build` |
| Lint | `bun run lint` |
| Type-check | `bun run check-types` |
| Format | `bun run format` |
| DB migrations | `bun run db:migrate` |

### Environment variables

All env vars live in a single `.env` file at the **monorepo root** (not in `apps/web/`). The Astro config loads them from the monorepo root via Vite's `loadEnv`. Copy `.env.example` to `.env` and fill in real values for external services.

**Required for the dev server to start:** The dev server starts fine with placeholder values. Real credentials are only needed when exercising API routes that call external services (Neon Postgres, Stripe, Google Calendar, Zoom, Resend).

### Gotchas

- **Bun is the package manager** — do not use npm/yarn/pnpm for dependency management. Install Bun via `npm install -g bun@1.2.21` if not available.
- **Turbo TUI mode:** `turbo.json` sets `"ui": "tui"` which can be problematic in non-interactive terminals. Run the Astro dev server directly with `cd apps/web && bunx astro dev --host 0.0.0.0` if `bun run dev` hangs or produces garbled output.
- **Tailwind v4:** This project uses Tailwind CSS v4. Do not use `@apply` directives — they are not supported.
- **No automated test suite:** There are no unit/integration test files or test runner configured. Validation is done via lint, type-check, and build.
- **`packages/shared-booking` is a git submodule** that is not initialized by default. The app builds and runs without it.
- **Vercel adapter:** The Astro build uses `@astrojs/vercel` adapter. The build output goes to `.vercel/` — this is expected even in local dev.
