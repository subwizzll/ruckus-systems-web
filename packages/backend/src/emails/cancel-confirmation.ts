export const CANCEL_CONFIRMATION_EMAIL_SUBJECT = "Booking cancelled - Ruckus Systems";

export type CancelConfirmationEmailInput = {
  clientFirstName: string;
  serviceTitle: string;
  previousStartTimeIso: string;
  timezone: string;
  /** When true, `refundAmountCents` should be set for the summary line. */
  refunded?: boolean;
  /** Stripe-style amount in cents, when a refund was issued. */
  refundAmountCents?: number;
  /** Full URL for rebooking (e.g. `${origin}/#book-now`). */
  rebookUrl?: string;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatSlotDisplay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

function formatRefundUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/**
 * Full HTML document for Resend. Inline styles + table wrapper for common mail clients.
 */
export function buildCancelConfirmationEmailHtml(input: CancelConfirmationEmailInput): string {
  const {
    clientFirstName,
    serviceTitle,
    previousStartTimeIso,
    timezone,
    refunded,
    refundAmountCents,
    rebookUrl,
  } = input;
  const slotLabel = formatSlotDisplay(previousStartTimeIso, timezone);

  let refundParagraph = "";
  if (refunded && refundAmountCents != null) {
    refundParagraph = `
              <p style="margin:0 0 16px 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.55;color:#586e75;">
                We&rsquo;ve processed a refund of <strong style="color:#073642;">${escapeHtml(formatRefundUsd(refundAmountCents))}</strong> to your original payment method. It may take a few business days to appear.
              </p>`;
  }

  let rebookBlock = "";
  if (rebookUrl) {
    rebookBlock = `
          <tr>
            <td style="padding:0 24px 24px 24px;background-color:#fdf6e3;">
              <a href="${escapeHtml(rebookUrl)}" style="display:inline-block;padding:12px 20px;background-color:#268bd2;color:#fdf6e3;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                Book again
              </a>
            </td>
          </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(CANCEL_CONFIRMATION_EMAIL_SUBJECT)}</title>
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
                Booking cancelled
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 8px 24px;background-color:#fdf6e3;">
              <p style="margin:0 0 12px 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.55;color:#586e75;">
                Hi ${escapeHtml(clientFirstName)},
              </p>
              <p style="margin:0 0 12px 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.55;color:#586e75;">
                Your <strong style="color:#073642;">${escapeHtml(serviceTitle)}</strong> appointment has been cancelled. It was scheduled for:
              </p>
              <p style="margin:0 0 16px 0;font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;font-size:16px;line-height:1.55;color:#073642;font-weight:600;">
                ${escapeHtml(slotLabel)}
              </p>${refundParagraph}
            </td>
          </tr>${rebookBlock}
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
