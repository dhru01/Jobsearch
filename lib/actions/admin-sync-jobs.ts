"use server";

import { revalidatePath } from "next/cache";
import { getProfileForUser } from "@/lib/auth";
import { requireAdminUser } from "@/lib/auth/admin";
import { runApifyJobSync } from "@/lib/jobs/ingest-apify";
import { ApifyNotConfiguredError } from "@/lib/jobs/sources/apify-shared";
import { enabledApifySources } from "@/lib/jobs/apify-config";
import { candidateProfileToInput } from "@/lib/profile";

export type SyncJobsState = {
  error: string | null;
  ok: boolean;
  summary: string | null;
};

const empty: SyncJobsState = { error: null, ok: false, summary: null };

/** Admin-only: run enabled Apify scrapers (small cap per source) and persist to Supabase. */
export async function syncJobsAdmin(_prev: SyncJobsState, _formData: FormData): Promise<SyncJobsState> {
  let userId: string;
  try {
    const ctx = await requireAdminUser();
    userId = ctx.user.id;
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : "Not allowed.",
    };
  }

  const enabled = enabledApifySources();
  if (enabled.length === 0) {
    return {
      ...empty,
      error:
        "No Apify sources enabled. Set APIFY_ENABLE_PNET, APIFY_ENABLE_INDEED, and/or APIFY_ENABLE_LINKEDIN=true with actor IDs.",
    };
  }

  const profile = await getProfileForUser(userId);
  if (!profile || profile.extraction_status !== "confirmed") {
    return {
      ...empty,
      error: "Confirm your profile first so sync can use your roles and skills for search and filtering.",
    };
  }

  const profileInput = candidateProfileToInput(profile);

  try {
    const result = await runApifyJobSync({
      profile,
      profileFilter: profileInput,
    });

    revalidatePath("/dashboard/matches");
    revalidatePath("/dashboard");

    const search = result.apifySearch ?? result.pnetSearch;
    const summary = [
      `Sources: ${(result.sourcesRun ?? enabled).join(", ")}.`,
      search ? `Search: “${search.keyword}”${search.location ? ` in ${search.location}` : ""}.` : null,
      `Apify returned ${result.fetched} listing(s) total.`,
      `${result.inserted} new job(s) saved.`,
      `${result.updated} existing job(s) updated.`,
      (result.skippedNotRelevant ?? 0) > 0
        ? `${result.skippedNotRelevant} skipped (no profile overlap).`
        : null,
      (result.skippedNotSouthAfrica ?? 0) > 0
        ? `${result.skippedNotSouthAfrica} skipped (not South Africa).`
        : null,
      result.skippedDuplicate > 0 ? `${result.skippedDuplicate} duplicate(s) skipped.` : null,
      result.errors.length > 0 ? `${result.errors.length} warning(s) — see server logs.` : null,
    ]
      .filter(Boolean)
      .join(" ");

    return { error: null, ok: true, summary };
  } catch (error) {
    if (error instanceof ApifyNotConfiguredError) {
      return { ...empty, error: error.message };
    }
    console.error("Apify job sync failed", error);
    return {
      ...empty,
      error: error instanceof Error ? error.message : "Job sync failed.",
    };
  }
}
