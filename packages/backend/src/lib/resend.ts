import { Resend } from "resend";

function resolveResendFromAddress(): string {
  const fromEmail =
    (import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL)?.trim();
  if (fromEmail) return fromEmail;
  if (process.env.VERCEL_ENV === "production") return "jared@ruckussystems.dev";
  return "onboarding@resend.dev";
}

export async function sendEmail(to: string[], subject: string, html: string) {
  const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const resend = new Resend(apiKey);
  const fromAddress = resolveResendFromAddress();
  const from = `Ruckus Systems <${fromAddress}>`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) return { success: false, error };
  return { success: true, data };
}
