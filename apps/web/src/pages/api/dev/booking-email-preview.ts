import type { APIRoute } from "astro";
import { buildBookingConfirmationEmailHtml } from "@workspace/backend";

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
  const html = buildBookingConfirmationEmailHtml({
    clientFirstName: "Alex",
    serviceTitle: "Strategy Call",
    rescheduleUrl: `${base}/reschedule?token=preview-token`,
    cancelUrl: `${base}/cancel?token=preview-token`,
  });

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
