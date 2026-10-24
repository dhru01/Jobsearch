import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canAutoSubmit, normalizePreferences } from "@/lib/apply/preferences";
import { detectApplyWorkflow, workflowCanAutoSubmit } from "@/lib/apply/workflow";
import { notifyApplicationEvent } from "@/lib/email/application-events";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export async function countSubmittedToday(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["submitted", "applying", "queued", "awaiting_approval"])
    .gte("created_at", startOfUtcDay());
  if (error) throw error;
  return count ?? 0;
}

export async function enqueueEligibleMatches(supabase: SupabaseClient, userId: string) {
  const { data: prefRow } = await supabase
    .from("application_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const prefs = normalizePreferences(prefRow as Record<string, unknown> | null, userId);
  if (prefs.mode === "manual" || prefs.paused) {
    return { queued: 0, awaiting: 0, skipped: 0 };
  }

  const usedToday = await countSubmittedToday(supabase, userId);
  const remaining = Math.max(0, prefs.max_per_day - usedToday);
  if (remaining === 0) return { queued: 0, awaiting: 0, skipped: 0 };

  const { data: matches } = await supabase
    .from("matches")
    .select("job_id, score, eligibility_pass, jobs(id, title, company, original_url, source)")
    .eq("user_id", userId)
    .eq("eligibility_pass", true)
    .gte("score", prefs.min_score)
    .order("score", { ascending: false })
    .limit(remaining * 3);

  const { data: existing } = await supabase.from("applications").select("job_id").eq("user_id", userId);
  const already = new Set((existing ?? []).map((row) => row.job_id as string));

  let queued = 0;
  let awaiting = 0;
  let skipped = 0;

  for (const match of matches ?? []) {
    if (queued + awaiting >= remaining) break;
    const job = Array.isArray(match.jobs) ? match.jobs[0] : match.jobs;
    if (!job) continue;
    if (already.has(job.id as string)) {
      skipped += 1;
      continue;
    }
    const company = String(job.company ?? "");
    if (prefs.excluded_companies.some((name) => company.toLowerCase().includes(name.toLowerCase()))) {
      skipped += 1;
      continue;
    }

    const workflow = detectApplyWorkflow(String(job.original_url ?? ""), String(job.source ?? ""));
    const auto = prefs.mode === "automatic" && canAutoSubmit(prefs) && workflowCanAutoSubmit(workflow);
    const status = auto ? "queued" : "awaiting_approval";

    const { data: inserted, error } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        job_id: job.id,
        status,
        match_score: match.score,
        workflow: workflow === "greenhouse" && process.env.APPLY_LIVE !== "true" ? "unsupported" : workflow,
        queued_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") skipped += 1;
      else console.error("Enqueue application failed", error.message);
      continue;
    }

    already.add(job.id as string);
    if (status === "queued") queued += 1;
    else awaiting += 1;

    if (inserted && auto) {
      const admin = createServiceRoleClient();
      await admin.from("application_queue").insert({
        application_id: inserted.id,
        user_id: userId,
        status: process.env.APPLY_LIVE === "true" || workflow === "mock" ? "pending" : "held",
      });
    }

    await supabase.from("application_events").insert({
      application_id: inserted.id,
      user_id: userId,
      event_type: status === "queued" ? "queued" : "awaiting_approval",
      payload: { workflow, score: match.score },
    });
  }

  return { queued, awaiting, skipped };
}

export async function notifyNeedsApproval(email: string | null, count: number) {
  if (count <= 0) return;
  await notifyApplicationEvent({
    to: email,
    subject: `Fieldwork: ${count} application(s) need your approval`,
    text: `${count} prepared application(s) are waiting for you to review before anything is submitted.`,
  });
}
