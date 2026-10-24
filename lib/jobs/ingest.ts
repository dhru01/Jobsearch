import { fetchGreenhouseListings, parseGreenhouseBoardsFromEnv } from "@/lib/jobs/sources/greenhouse";
import { fetchSerpApiListings } from "@/lib/jobs/sources/serpapi";
import { normalizeListing } from "@/lib/jobs/normalize";
import type { IngestionResult, NormalizedJob, RawListing } from "@/lib/jobs/types";
import { candidateProfileToInput, normalizeProfile, rescoreMatches } from "@/lib/profile";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const INGESTED_SOURCES = ["serpapi", "greenhouse", "fixtures"];

export type IngestOptions = {
  useFixtures?: boolean;
  fixturePath?: string;
  skipRescore?: boolean;
};

async function loadListings(options: IngestOptions) {
  const listings: RawListing[] = [];
  const sourceCounts: Record<string, number> = {};

  if (options.useFixtures) {
    const { fetchFixtureListings } = await import("@/lib/jobs/sources/fixtures");
    const batch = await fetchFixtureListings(options.fixturePath);
    listings.push(...batch);
    sourceCounts.fixtures = batch.length;
    return { listings, sourceCounts };
  }

  try {
    const serp = await fetchSerpApiListings();
    listings.push(...serp);
    sourceCounts.serpapi = serp.length;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("SERPAPI_API_KEY")) throw error;
    sourceCounts.serpapi = 0;
  }

  const boards = parseGreenhouseBoardsFromEnv(process.env.GREENHOUSE_BOARD_TOKENS);
  if (boards.length > 0) {
    const greenhouse = await fetchGreenhouseListings(boards);
    listings.push(...greenhouse);
    sourceCounts.greenhouse = greenhouse.length;
  }

  if (listings.length === 0) {
    throw new Error(
      "No listings fetched. Set SERPAPI_API_KEY, configure GREENHOUSE_BOARD_TOKENS, or run the CLI with --fixtures.",
    );
  }

  return { listings, sourceCounts };
}

export async function runJobIngestion(options: IngestOptions = {}): Promise<IngestionResult> {
  const supabase = createServiceRoleClient();
  const runStartedAt = new Date();
  const errors: string[] = [];

  const { data: runRow, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({ started_at: runStartedAt.toISOString() })
    .select("id")
    .single();
  if (runError) throw runError;

  const runId = runRow.id as string;
  let inserted = 0;
  let updated = 0;
  let skippedDuplicate = 0;
  let staleMarked = 0;
  let rescoredUsers = 0;

  try {
    const { listings, sourceCounts } = await loadListings(options);
    const normalized: NormalizedJob[] = [];

    for (const listing of listings) {
      try {
        const row = normalizeListing(listing, runStartedAt);
        if (row) normalized.push(row);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
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

    for (const job of normalized) {
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

    const { data: staleRows, error: staleError } = await supabase
      .from("jobs")
      .update({ is_stale: true })
      .in("source", INGESTED_SOURCES)
      .lt("last_verified_at", runStartedAt.toISOString())
      .select("id");
    if (staleError) throw staleError;
    staleMarked = staleRows?.length ?? 0;

    if (!options.skipRescore) {
      const { data: profiles, error: profileError } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("extraction_status", "confirmed");
      if (profileError) throw profileError;

      for (const row of profiles ?? []) {
        try {
          const profile = normalizeProfile(row as Record<string, unknown>);
          await rescoreMatches(supabase, profile.user_id, candidateProfileToInput(profile));
          rescoredUsers += 1;
        } catch (error) {
          errors.push(`rescore ${row.user_id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    await supabase
      .from("ingestion_runs")
      .update({
        finished_at: new Date().toISOString(),
        source_counts: sourceCounts,
        inserted,
        updated,
        skipped_duplicate: skippedDuplicate,
        stale_marked: staleMarked,
        rescored_users: rescoredUsers,
        errors,
      })
      .eq("id", runId);

    return {
      runId,
      fetched: listings.length,
      inserted,
      updated,
      skippedDuplicate,
      staleMarked,
      rescoredUsers,
      sourceCounts,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    await supabase
      .from("ingestion_runs")
      .update({
        finished_at: new Date().toISOString(),
        errors,
      })
      .eq("id", runId);
    throw error;
  }
}
