import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend";
import { formatScore } from "@/lib/labels";
import { normalizeProfile } from "@/lib/profile";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type DigestMatch = {
  score: number;
  jobTitle: string;
  company: string;
  location: string;
};

export async function topEligibleMatches(
  supabase: SupabaseClient,
  userId: string,
  limit = 5,
): Promise<DigestMatch[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("score, jobs(title, company, location, is_stale)")
    .eq("user_id", userId)
    .eq("eligibility_pass", true)
    .order("score", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const rows: DigestMatch[] = [];
  for (const row of data ?? []) {
    const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
    if (!job || job.is_stale) continue;
    rows.push({
      score: Number(row.score),
      jobTitle: job.title as string,
      company: job.company as string,
      location: job.location as string,
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

export function buildDigestEmail(firstName: string | null, matches: DigestMatch[]) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const lines =
    matches.length === 0
      ? ["No new eligible matches stood out today. Update your profile or check Matches in Fieldwork."]
      : matches.map(
          (match, index) =>
            `${index + 1}. ${match.jobTitle} at ${match.company} (${match.location}) — score ${formatScore(match.score)}`,
        );

  const text = [greeting, "", "Your Fieldwork shortlist for today:", "", ...lines, "", `Open your dashboard: ${siteUrl}/dashboard/matches`].join(
    "\n",
  );

  const listItems = matches.length
    ? matches
        .map(
          (match) =>
            `<li><strong>${match.jobTitle}</strong> · ${match.company}<br/><span style="color:#666">${match.location} · score ${formatScore(match.score)}</span></li>`,
        )
        .join("")
    : "<li>No eligible matches to highlight today. Visit your dashboard to browse roles.</li>";

  const html = `
    <p>${greeting}</p>
    <p>Your Fieldwork shortlist for today:</p>
    <ul>${listItems}</ul>
    <p><a href="${siteUrl}/dashboard/matches">View matches</a></p>
    <p style="color:#888;font-size:12px">You receive this because daily digests are enabled on your Pro plan.</p>
  `;

  return {
    subject: matches.length ? `Fieldwork: ${matches.length} roles to review` : "Fieldwork: your daily match digest",
    text,
    html,
  };
}

export async function sendUserDigest(supabase: SupabaseClient, userId: string) {
  const { data: profileRow, error: profileError } = await supabase
    .from("candidate_profiles")
    .select("full_name, email, preferences, extraction_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileRow || profileRow.extraction_status !== "confirmed") return { sent: false, reason: "no_profile" };

  const profile = normalizeProfile(profileRow as Record<string, unknown>);
  if (!profile.preferences.digest_email) return { sent: false, reason: "opt_out" };

  const email = profile.email?.trim();
  if (!email) return { sent: false, reason: "no_email" };

  const matches = await topEligibleMatches(supabase, userId);
  const firstName = profile.full_name?.split(" ")[0] ?? null;
  const content = buildDigestEmail(firstName, matches);

  await sendEmail({ to: email, ...content });
  return { sent: true, matchCount: matches.length };
}
