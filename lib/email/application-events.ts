import "server-only";
import { sendEmail, EmailNotConfiguredError } from "@/lib/email/resend";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function notifyApplicationEvent(input: {
  to: string | null | undefined;
  subject: string;
  text: string;
}) {
  if (!input.to) return;
  try {
    await sendEmail({
      to: input.to,
      subject: input.subject,
      text: `${input.text}\n\n${siteUrl}/dashboard/applications`,
      html: `<p>${input.text}</p><p><a href="${siteUrl}/dashboard/applications">Open applications</a></p>`,
    });
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) return;
    console.error("Application email failed", error);
  }
}
