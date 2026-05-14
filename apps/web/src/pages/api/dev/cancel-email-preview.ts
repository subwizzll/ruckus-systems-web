import type { APIRoute } from "astro";
import { buildCancelConfirmationEmailHtml } from "@workspace/backend";

/**
 * Open in the browser while `astro dev` is running — returns the same HTML Resend sends,
 * without calling Resend. Disabled in production builds.
 */
export const GET: APIRoute = async () => {
  if (import.meta.env.PROD) {
    return new Response("Not found", { status: 404 });
  }

  const base =
    import.meta.env.PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:4321";
  const html = buildCancelConfirmationEmailHtml({
    clientFirstName: "Alex",
    serviceTitle: "Strategy Call",
    previousStartTimeIso: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: "America/New_York",
    refunded: true,
    refundAmountCents: 25000,
    rebookUrl: `${base}/#book-now`,
  });

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
