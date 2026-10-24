import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeListing } from "@/lib/jobs/normalize";
import { jobRelevantToProfile } from "@/lib/jobs/profile-pnet-search";
import type { NormalizedJob, RawListing } from "@/lib/jobs/types";
import { jobMatchesEmploymentFilters } from "@/lib/jobs/match-filters";
import type { ProfileInput } from "@/lib/validation/profile";

export type PersistListingsResult = {
  inserted: number;
  updated: number;
  skippedDuplicate: number;
  skippedNotRelevant: number;
  skippedNotSouthAfrica: number;
  errors: string[];
  normalizedCount: number;
};

export async function persistRawListings(
  supabase: SupabaseClient,
  listings: RawListing[],
  runStartedAt: Date,
  options?: {
    profileFilter?: ProfileInput;
    employmentFilter?: string[];
    sourcesToMarkStale?: string[];
  },
): Promise<PersistListingsResult> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let skippedDuplicate = 0;
  let skippedNotRelevant = 0;
  let skippedNotSouthAfrica = 0;

  const normalized: NormalizedJob[] = [];
  for (const listing of listings) {
    try {
      const row = normalizeListing(listing, runStartedAt);
      if (row) normalized.push(row);
      else skippedNotSouthAfrica += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const toPersist: NormalizedJob[] = [];
  const employmentFilter = options?.employmentFilter ?? [];
  for (const job of normalized) {
    if (options?.profileFilter && !jobRelevantToProfile(job, options.profileFilter)) {
      skippedNotRelevant += 1;
      continue;
    }
    if (!jobMatchesEmploymentFilters(job, employmentFilter)) {
      skippedNotRelevant += 1;
      continue;
    }
    toPersist.push(job);
  }

  const { data: existingFingerprints } = await supabase
    .from("jobs")
    .select("fingerprint, source, source_id")
    .not("fingerprint", "is", null);

  const fingerprintOwners = new Map<string, { source: string; source_id: string }>(
    (existingFingerprints ?? []).map((row) => [
      row.fingerprint as string,
      { source: row.source as string, source_id: row.source_id as string },
    ]),
  );

  for (const job of toPersist) {
    const owner = fingerprintOwners.get(job.fingerprint);
    if (owner && (owner.source !== job.source || owner.source_id !== job.source_id)) {
      skippedDuplicate += 1;
      continue;
    }

    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("source", job.source)
      .eq("source_id", job.source_id)
      .maybeSingle();

    const { error } = await supabase.from("jobs").upsert(job, { onConflict: "source,source_id" });
    if (error) {
      errors.push(`${job.source}:${job.source_id} — ${error.message}`);
      continue;
    }

    if (existing?.id) updated += 1;
    else inserted += 1;
    fingerprintOwners.set(job.fingerprint, { source: job.source, source_id: job.source_id });
  }

  if (options?.sourcesToMarkStale?.length) {
    const { error: staleError } = await supabase
      .from("jobs")
      .update({ is_stale: true })
      .in("source", options.sourcesToMarkStale)
      .lt("last_verified_at", runStartedAt.toISOString());
    if (staleError) errors.push(`stale mark: ${staleError.message}`);
  }

  return {
    inserted,
    updated,
    skippedDuplicate,
    skippedNotRelevant,
    skippedNotSouthAfrica,
    errors,
    normalizedCount: normalized.length,
  };
}
