"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/billing/subscription";
import { ensureProfileForUser, requireUser } from "@/lib/auth";
import { rescoreMatches } from "@/lib/profile";
import { profileSchema, profileToRow } from "@/lib/validation/profile";

export type ProfileState = { error: string | null };

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireUser();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "The profile could not be read. Try again." };
  }

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { data: existingRow, error: existingError } = await supabase
    .from("candidate_profiles")
    .select("id, confirmed_at, accuracy_confirmed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("Profile lookup failed before save", existingError.message);
    return { error: "We could not load your profile to save. Refresh the page and try again." };
  }

  let existing = existingRow;
  if (!existing) {
    await ensureProfileForUser(user, supabase);
    const { data: retryRow, error: retryError } = await supabase
      .from("candidate_profiles")
      .select("id, confirmed_at, accuracy_confirmed_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (retryError || !retryRow) {
      return { error: "Your profile record is missing. Sign out and sign in again." };
    }
    existing = retryRow;
  }

  const subscription = await getUserSubscription(supabase, user.id);
  const preferences = {
    ...parsed.data.preferences,
    digest_email: subscription.plan === "pro" ? parsed.data.preferences.digest_email : false,
  };

  const row = profileToRow({ ...parsed.data, preferences });
  const extended = (parsed.data.profile_extended ?? {}) as Record<string, unknown>;
  const profileExtended =
    extended && typeof extended === "object" && !Array.isArray(extended) ? extended : {};
  const { error } = await supabase
    .from("candidate_profiles")
    .update({
      ...row,
      profile_extended: profileExtended,
      middle_name: typeof extended.middle_name === "string" ? extended.middle_name || null : undefined,
      alt_phone: typeof extended.alt_phone === "string" ? extended.alt_phone || null : undefined,
      postal_code: typeof extended.postal_code === "string" ? extended.postal_code || null : undefined,
      location_geoname_id:
        typeof extended.location_geoname_id === "string" ? extended.location_geoname_id || null : undefined,
      location_lat: extended.location_lat ? Number(extended.location_lat) : null,
      location_lng: extended.location_lng ? Number(extended.location_lng) : null,
      accuracy_confirmed_at: parsed.data.accuracy_confirmed
        ? ((existing as { accuracy_confirmed_at?: string | null }).accuracy_confirmed_at ??
          new Date().toISOString())
        : null,
      confirmed_at: existing.confirmed_at ?? new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Profile update failed", error.message);
    return { error: "The profile could not be saved." };
  }

  await supabase
    .from("documents")
    .update({ status: "confirmed" })
    .eq("user_id", user.id)
    .eq("status", "extracted");

  const customAnswers = Array.isArray(extended.custom_answers) ? extended.custom_answers : [];
  if (customAnswers.length > 0) {
    await supabase.from("profile_reusable_answers").delete().eq("user_id", user.id);
    const rows = customAnswers
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        user_id: user.id,
        question: String(item.question ?? "").trim(),
        answer: String(item.answer ?? "").trim(),
        category: String(item.category ?? "custom").trim() || "custom",
        confirmed: Boolean(item.confirmed),
      }))
      .filter((item) => item.question && item.answer);
    if (rows.length) await supabase.from("profile_reusable_answers").insert(rows);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/matches");
  revalidatePath("/onboarding");

  const tab = String(formData.get("tab") ?? "").trim();
  const next = new URLSearchParams({ saved: "1" });
  if (tab) next.set("tab", tab);

  try {
    await rescoreMatches(supabase, user.id, { ...parsed.data, preferences });
  } catch (scoreError) {
    console.error("Match scoring failed", scoreError);
    next.set("rescore", "failed");
    redirect(`/dashboard/profile?${next.toString()}`);
  }

  redirect(`/dashboard/profile?${next.toString()}`);
}
