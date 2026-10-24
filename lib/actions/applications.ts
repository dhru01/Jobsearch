"use server";

import { revalidatePath } from "next/cache";
import { requireConfirmedProfile } from "@/lib/auth";

export type ApplicationActionState = {
  error: string | null;
  ok: boolean;
};

const empty: ApplicationActionState = { error: null, ok: false };

export async function saveApplication(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const { supabase, user } = await requireConfirmedProfile();
  const { data, error } = await supabase
    .from("applications")
    .insert({ user_id: user.id, job_id: jobId, status: "saved" })
    .select("id")
    .single();

  if (error) {
    if (error.code !== "23505") {
      console.error("Save application failed", error.message);
    }
    return;
  }

  await supabase.from("application_events").insert({
    application_id: data.id,
    user_id: user.id,
    event_type: "saved",
    payload: { job_id: jobId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/matches");
  revalidatePath("/dashboard/applications");
}

async function loadOwnApplication(applicationId: string) {
  const { supabase, user } = await requireConfirmedProfile();
  const { data, error } = await supabase
    .from("applications")
    .select("id, status, notes")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { supabase, user, application: data };
}

export async function reportApplicationSubmission(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const applicationId = String(formData.get("application_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);

  if (!applicationId) return { ...empty, error: "Missing application." };

  const ctx = await loadOwnApplication(applicationId);
  if (!ctx) return { ...empty, error: "Application not found." };

  const { supabase, user, application } = ctx;
  const allowed = ["prepared", "opened", "draft", "saved"].includes(application.status);
  if (!allowed && application.status !== "unverified") {
    return { ...empty, error: "This application was already marked." };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "unverified",
      notes: notes || application.notes,
    })
    .eq("id", application.id);

  if (updateError) {
    console.error("Submission report failed", updateError.message);
    return { ...empty, error: "Could not save your confirmation." };
  }

  await supabase.from("application_events").insert({
    application_id: application.id,
    user_id: user.id,
    event_type: "submission_reported",
    payload: { verified: false, notes: notes || null },
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/applications");

  return { error: null, ok: true };
}

export async function withdrawApplication(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const applicationId = String(formData.get("application_id") ?? "");
  if (!applicationId) return { ...empty, error: "Missing application." };

  const ctx = await loadOwnApplication(applicationId);
  if (!ctx) return { ...empty, error: "Application not found." };

  const { supabase, user, application } = ctx;

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", application.id);

  if (updateError) {
    return { ...empty, error: "Could not withdraw this application." };
  }

  await supabase.from("application_events").insert({
    application_id: application.id,
    user_id: user.id,
    event_type: "withdrawn",
    payload: {},
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/applications");

  return { error: null, ok: true };
}
