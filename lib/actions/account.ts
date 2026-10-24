"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function exportMyData() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: documents }, { data: applications }, { data: answers }] = await Promise.all([
    supabase.from("candidate_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("documents").select("id, kind, file_name, mime_type, byte_size, created_at, is_default, description").eq("user_id", user.id),
    supabase.from("applications").select("id, status, created_at, submitted_at, job_id").eq("user_id", user.id),
    supabase.from("profile_reusable_answers").select("question, answer, category, confirmed, updated_at").eq("user_id", user.id),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile,
    documents: documents ?? [],
    applications: applications ?? [],
    reusable_answers: answers ?? [],
  };
}

export async function deleteAccount() {
  const { user } = await requireUser();
  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Delete account failed", error.message);
    redirect("/dashboard/profile?error=delete");
  }
  redirect("/");
}
