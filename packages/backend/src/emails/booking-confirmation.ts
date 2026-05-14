export const BOOKING_CONFIRMATION_EMAIL_SUBJECT = "Booking Confirmation - Ruckus Systems";

export type BookingConfirmationEmailInput = {
  clientFirstName: string;
  serviceTitle: string;
  rescheduleUrl: string;
  cancelUrl: string;
};

/**
 * Full HTML document for Resend. Inline styles + table wrapper for common mail clients.
 * Tweak here and preview at GET /api/dev/booking-email-preview (dev only).
 */
export function buildBookingConfirmationEmailHtml(input: BookingConfirmationEmailInput): string {
  const { clientFirstName, serviceTitle, rescheduleUrl, cancelUrl } = input;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(BOOKING_CONFIRMATION_EMAIL_SUBJECT)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Space+Grotesk:wght@400;600&display=swap" rel="stylesheet" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#fdf6e3;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fdf6e3;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#eee8d5;border:1px solid #93a1a1;border-radius:8px;overflow:hidden;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:28px 24px 20px 24px;background-color:#073642;">
              <p style="margin:0;font-family:'Share Tech Mono','Consolas',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#2aa198;">
                Ruckus Systems
              </p>
              <h1 style="margin:10px 0 0 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:22px;font-weight:600;line-height:1.25;color:#fdf6e3;">
                You&rsquo;re booked
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 8px 24px;background-color:#fdf6e3;">
              <p style="margin:0 0 12px 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.55;color:#586e75;">
                Hi ${esc(clientFirstName)},
              </p>
              <p style="margin:0 0 16px 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.55;color:#586e75;">
                Your <strong style="color:#073642;">${esc(serviceTitle)}</strong> is confirmed. Use the links below to reschedule or cancel if plans change.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;background-color:#fdf6e3;">
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <a href="${esc(rescheduleUrl)}" style="display:inline-block;padding:12px 20px;background-color:#268bd2;color:#fdf6e3;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                      Reschedule
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${esc(cancelUrl)}" style="display:inline-block;padding:12px 20px;background-color:transparent;color:#cb4b16;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:15px;font-weight:600;text-decoration:underline;border-radius:6px;border:1px solid #cb4b16;">
                      Cancel booking
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:12px;line-height:1.5;color:#657b83;word-break:break-all;">
                Reschedule: <a href="${esc(rescheduleUrl)}" style="color:#268bd2;">${esc(rescheduleUrl)}</a><br />
                Cancel: <a href="${esc(cancelUrl)}" style="color:#268bd2;">${esc(cancelUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background-color:#eee8d5;border-top:1px solid #93a1a1;">
              <p style="margin:0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:12px;line-height:1.5;color:#586e75;">
                Engineering-grade AI &amp; automation &middot; Asheville, NC
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
