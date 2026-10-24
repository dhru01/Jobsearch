import "server-only";
import { canReceiveDailyDigest } from "@/lib/billing/entitlements";
import { sendUserDigest } from "@/lib/email/digest";
import { EmailNotConfiguredError } from "@/lib/email/resend";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function runDailyDigest() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new EmailNotConfiguredError();
  }

  const supabase = createServiceRoleClient();
  const { data: profiles, error } = await supabase
    .from("candidate_profiles")
    .select("user_id, preferences, extraction_status")
    .eq("extraction_status", "confirmed");

  if (error) throw error;

  let attempted = 0;
  let sent = 0;
  const errors: string[] = [];

  for (const row of profiles ?? []) {
    const preferences = (row.preferences ?? {}) as { digest_email?: boolean };
    if (!preferences.digest_email) continue;

    const userId = row.user_id as string;
    attempted += 1;

    try {
      const allowed = await canReceiveDailyDigest(supabase, userId);
      if (!allowed) continue;

      const result = await sendUserDigest(supabase, userId);
      if (result.sent) sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "digest_failed";
      errors.push(`${userId}: ${message}`);
    }
  }

  return { attempted, sent, errors };
}
