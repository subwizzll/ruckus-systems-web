import { Resend } from "resend";

export async function sendEmail(to: string[], subject: string, html: string) {
  const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const resend = new Resend(apiKey);
  const from = import.meta.env.DEV
    ? "Ruckus Systems <onboarding@resend.dev>"
    : "Ruckus Systems <hello@ruckus.systems>";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) return { success: false, error };
  return { success: true, data };
}
