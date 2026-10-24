"use server";

import { revalidatePath } from "next/cache";
import { generateApplicationAnswers } from "@/lib/ai/application-answers";
import { enqueueEligibleMatches } from "@/lib/apply/enqueue";
import { detectApplyWorkflow } from "@/lib/apply/workflow";
import { requireConfirmedProfile } from "@/lib/auth";
import { notifyApplicationEvent } from "@/lib/email/application-events";
import { one } from "@/lib/labels";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type AutoApplyState = { error: string | null; ok: boolean; note: string | null };

const empty: AutoApplyState = { error: null, ok: false, note: null };

export async function saveAutoApplySettings(_prev: AutoApplyState, formData: FormData): Promise<AutoApplyState> {
  const { supabase, user } = await requireConfirmedProfile();
  const modeRaw = String(formData.get("mode") ?? "approval_required");
  const mode = modeRaw === "manual" || modeRaw === "automatic" || modeRaw === "approval_required" ? modeRaw : "approval_required";
  const consent = formData.get("auto_submit_consent") === "on";

  if (mode === "automatic" && !consent) {
    return { ...empty, error: "Automatic mode needs explicit consent to submit on your behalf." };
  }

  const { data: existing } = await supabase
    .from("application_preferences")
    .select("auto_submit_consent_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("application_preferences")
    .update({
      mode,
      paused: formData.get("paused") === "on",
      min_score: Number(formData.get("min_score") ?? 50),
      max_per_day: Number(formData.get("max_per_day") ?? 5),
      preferred_titles: split(formData.get("preferred_titles")),
      preferred_locations: split(formData.get("preferred_locations")),
      min_salary: numberOrNull(formData.get("min_salary")),
      employment_types: split(formData.get("employment_types")),
      excluded_companies: split(formData.get("excluded_companies")),
      excluded_industries: split(formData.get("excluded_industries")),
      auto_submit_consent_at:
        mode === "automatic" && consent
          ? (existing?.auto_submit_consent_at as string | null) ?? new Date().toISOString()
          : existing?.auto_submit_consent_at ?? null,
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Save auto-apply settings failed", error.message);
    return { ...empty, error: "Could not save settings." };
  }

  revalidatePath("/dashboard/auto-apply");
  revalidatePath("/dashboard");
  return { error: null, ok: true, note: "Auto-apply settings saved. Live website submissions stay off until you approve them." };
}

function split(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function prepareApplicationAnswers(
  _prev: AutoApplyState,
  formData: FormData,
): Promise<AutoApplyState> {
  const applicationId = String(formData.get("application_id") ?? "");
  const { supabase, user, profile } = await requireConfirmedProfile();
  const { data, error } = await supabase
    .from("applications")
    .select("id, job_id, jobs(title, company, description, requirements)")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return { ...empty, error: "Application not found." };
  const job = one(
    data.jobs as
      | { title: string; company: string; description: string; requirements: string }
      | { title: string; company: string; description: string; requirements: string }[]
      | null,
  );
  if (!job) return { ...empty, error: "Job not found." };

  const generated = await generateApplicationAnswers({
    profile,
    job,
  });

  await supabase.from("application_answers").delete().eq("application_id", applicationId).eq("user_id", user.id);
  await supabase.from("application_answers").insert(
    generated.answers.map((answer) => ({
      user_id: user.id,
      application_id: applicationId,
      question: answer.question,
      answer: answer.value,
      source: answer.source === "unknown" ? "openai" : answer.source,
      needs_user: answer.needs_user,
      approved: !answer.needs_user,
    })),
  );

  await supabase
    .from("applications")
    .update({
      status: generated.answers.some((item) => item.needs_user) ? "action_required" : "preparing",
      answers_json: { answers: generated.answers, used_ai: generated.usedAi },
    })
    .eq("id", applicationId);

  await supabase.from("application_events").insert({
    application_id: applicationId,
    user_id: user.id,
    event_type: "answers_generated",
    payload: { used_ai: generated.usedAi },
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  return {
    error: null,
    ok: true,
    note: generated.usedAi
      ? "Draft answers generated from your confirmed profile. Review anything flagged."
      : "Draft answers filled from your profile (no OpenAI key).",
  };
}

export async function approveAndQueueApplication(formData: FormData) {
  const applicationId = String(formData.get("application_id") ?? "");
  const { supabase, user, profile } = await requireConfirmedProfile();
  const { data } = await supabase
    .from("applications")
    .select("id, job_id, workflow, jobs(original_url, source)")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return;

  const job = one(
    data.jobs as { original_url: string; source: string } | { original_url: string; source: string }[] | null,
  );
  const workflow = data.workflow === "mock" ? "mock" : detectApplyWorkflow(job?.original_url ?? "", job?.source);
  const live = process.env.APPLY_LIVE === "true";
  const queueStatus = workflow === "mock" || (workflow === "greenhouse" && live) ? "pending" : "held";

  await supabase.from("applications").update({ status: "queued", workflow, queued_at: new Date().toISOString() }).eq("id", applicationId);

  const admin = createServiceRoleClient();
  await admin.from("application_queue").upsert(
    {
      application_id: applicationId,
      user_id: user.id,
      status: queueStatus,
      attempts: 0,
      last_error: queueStatus === "held" ? "Held: live auto-submit is off, or this site is not supported." : null,
    },
    { onConflict: "application_id" },
  );

  await supabase.from("application_events").insert({
    application_id: applicationId,
    user_id: user.id,
    event_type: "approved",
    payload: { workflow, queue_status: queueStatus },
  });

  await notifyApplicationEvent({
    to: profile.email,
    subject: "Fieldwork: application queued",
    text:
      queueStatus === "pending"
        ? "Your application was approved and queued for the mock/supported worker."
        : "Your application was approved but not submitted. PNet, LinkedIn, and Indeed stay assisted-only until a permitted workflow is enabled.",
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/applications");
}

export async function updateApplicationStatus(formData: FormData) {
  const applicationId = String(formData.get("application_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["interview", "rejected", "offer", "withdrawn", "unverified"];
  if (!allowed.includes(status)) return;
  const { supabase, user } = await requireConfirmedProfile();
  await supabase.from("applications").update({ status }).eq("id", applicationId).eq("user_id", user.id);
  await supabase.from("application_events").insert({
    application_id: applicationId,
    user_id: user.id,
    event_type: "status_updated",
    payload: { status, manual: true },
  });
  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/applications");
}

export async function runEnqueueNow(): Promise<AutoApplyState> {
  const { supabase, user, profile } = await requireConfirmedProfile();
  const result = await enqueueEligibleMatches(supabase, user.id);
  await notifyApplicationEvent({
    to: profile.email,
    subject: "Fieldwork: matches queued for review",
    text: `${result.awaiting} need approval. ${result.queued} queued. ${result.skipped} skipped.`,
  });
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/auto-apply");
  return {
    error: null,
    ok: true,
    note: `${result.awaiting} awaiting approval, ${result.queued} queued, ${result.skipped} skipped. Nothing is submitted to PNet, LinkedIn, or Indeed.`,
  };
}
