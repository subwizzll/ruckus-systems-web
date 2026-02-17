# ruckus-systems-web

Portfolio monorepo powered by Astro and Bun.

## Requirements

- Bun `1.2.21` or newer

## Development

From the repo root:

```bash
bun install
bun run dev
```

The web app runs from `apps/web` on Astro's default dev port (`4321`).

## Build

Build all workspace packages:

```bash
bun run build
```

Or build just the web app:

```bash
cd apps/web
bun run build
```
