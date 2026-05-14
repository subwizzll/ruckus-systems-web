/**
 * Origin for user-facing URLs (emails, JSON responses). Prefer PUBLIC_APP_URL in
 * production so links stay correct when the request URL does not match the public host.
 */
export function getPublicSiteOrigin(request: Request, url: URL): string {
  const envUrl = import.meta.env.PUBLIC_APP_URL || process.env.PUBLIC_APP_URL;
  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch {
      /* ignore invalid env */
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = forwardedProto || "https";
    return `${proto}://${forwardedHost}`;
  }

  return url.origin;
}
