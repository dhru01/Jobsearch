import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile, type CandidateProfile } from "@/lib/profile";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function getAuth() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getAuth();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getProfileForUser(userId: string, supabase?: ServerSupabase) {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeProfile(data as Record<string, unknown>) : null;
}

/** Backfill profile row if signup predates the auth trigger or trigger failed once. */
export async function ensureProfileForUser(
  user: { id: string; email?: string | null },
  supabase: ServerSupabase,
) {
  const existing = await getProfileForUser(user.id, supabase);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("candidate_profiles")
    .insert({
      user_id: user.id,
      email: user.email ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return normalizeProfile(data as Record<string, unknown>);
}

export async function requireConfirmedProfile(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  profile: CandidateProfile;
}> {
  const { supabase, user } = await requireUser();
  const profile = await getProfileForUser(user.id, supabase);
  if (!profile || profile.extraction_status !== "confirmed") {
    redirect("/onboarding");
  }
  return { supabase, user, profile };
}
