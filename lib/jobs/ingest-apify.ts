import { apifySearchKeywords, type ApifySearchTerms } from "@/lib/jobs/apify-search-from-filters";
import {
  enabledApifySources,
  isApifySourceEnabled,
  linkedInResultsCap,
  maxResultsPerSource,
  type ApifyJobSource,
} from "@/lib/jobs/apify-config";
import { buildPnetSearchFromProfile } from "@/lib/jobs/profile-pnet-search";
import { persistRawListings } from "@/lib/jobs/ingest-persist";
import { fetchIndeedListingsFromApify } from "@/lib/jobs/sources/apify-indeed";
import { fetchLinkedInListingsFromApify } from "@/lib/jobs/sources/apify-linkedin";
import { fetchPnetListingsFromApify } from "@/lib/jobs/sources/apify-pnet";
import { rawListingsFromApifyItems } from "@/lib/jobs/sources/pnet-listing-map";
import type { IngestionResult, RawListing } from "@/lib/jobs/types";
import type { ProfileInput } from "@/lib/validation/profile";
import type { CandidateProfile } from "@/lib/profile";
import { candidateProfileToInput, normalizeProfile, rescoreMatches } from "@/lib/profile";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type ApifySyncOptions = {
  skipRescore?: boolean;
  profileFilter?: ProfileInput;
  profile?: CandidateProfile;
  searchOverride?: ApifySearchTerms;
  /** Limit to specific sources (must still be enabled in env). */
  sources?: ApifyJobSource[];
  /** When set, only this user's matches are rescored. */
  rescoreUserId?: string;
  /** Admin bulk sync can mark unseen source rows stale. User search should not. */
  markStale?: boolean;
};

type SourceFetchMeta = {
  fetched: number;
  apifyRunId?: string;
  apifyDatasetId?: string;
  error?: string;
};

async function fetchListingsForSource(
  source: ApifyJobSource,
  search: { keyword: string; location: string },
): Promise<{ listings: RawListing[]; meta: SourceFetchMeta }> {
  const cap = maxResultsPerSource();

  try {
    if (source === "pnet") {
      const { items, runId, datasetId } = await fetchPnetListingsFromApify({
        input: {
          results_wanted: cap,
          keyword: search.keyword,
          location: search.location,
        },
      });
      return {
        listings: rawListingsFromApifyItems(items),
        meta: { fetched: items.length, apifyRunId: runId, apifyDatasetId: datasetId },
      };
    }

    if (source === "indeed") {
      const result = await fetchIndeedListingsFromApify({
        input: {
          count: cap,
          query: search.keyword,
          location: search.location || "South Africa",
        },
      });
      return {
        listings: result.listings,
        meta: {
          fetched: result.items.length,
          apifyRunId: result.runId,
          apifyDatasetId: result.datasetId,
        },
      };
    }

    const city =
      search.location && !/south africa/i.test(search.location) ? search.location.trim() : undefined;
    const result = await fetchLinkedInListingsFromApify({
      input: {
        jobs_titles: [search.keyword],
        location: "South Africa",
        ...(city ? { cities: [city] } : {}),
        jobs_entries: linkedInResultsCap(),
        scrape_mode: "quick",
      },
    });
    return {
      listings: result.listings,
      meta: {
        fetched: result.items.length,
        apifyRunId: result.runId,
        apifyDatasetId: result.datasetId,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[apify-sync] ${source} failed`, message);
    return { listings: [], meta: { fetched: 0, error: message } };
  }
}

export async function runApifyJobSync(options: ApifySyncOptions = {}): Promise<IngestionResult> {
  const sources =
    options.sources?.filter((source) => isApifySourceEnabled(source)) ?? enabledApifySources();

  if (sources.length === 0) {
    throw new Error(
      "No Apify job sources are enabled. Set APIFY_API_TOKEN, actor IDs, and APIFY_ENABLE_PNET / APIFY_ENABLE_INDEED / APIFY_ENABLE_LINKEDIN=true.",
    );
  }

  const search: ApifySearchTerms =
    options.searchOverride ??
    (options.profile
      ? buildPnetSearchFromProfile(options.profile)
      : {
          keyword: process.env.APIFY_DEFAULT_KEYWORD?.trim() || "graduate",
          location: process.env.APIFY_DEFAULT_LOCATION?.trim() || "South Africa",
        });

  const supabase = createServiceRoleClient();
  const runStartedAt = new Date();
  const errors: string[] = [];
  const sourceCounts: Record<string, number> = {};
  const sourcesRun: string[] = [];

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
  let skippedNotRelevant = 0;
  let skippedNotSouthAfrica = 0;
  let staleMarked = 0;
  let rescoredUsers = 0;
  let fetched = 0;

  const apifyMeta: Record<string, unknown> = {};

  try {
    const keywords = apifySearchKeywords(search);

    for (const source of sources) {
      sourcesRun.push(source);
      const mergedListings: RawListing[] = [];
      const listingKeys = new Set<string>();
      const sourceMeta: SourceFetchMeta[] = [];

      for (const keyword of keywords) {
        const { listings, meta } = await fetchListingsForSource(source, {
          keyword,
          location: search.location,
        });
        fetched += meta.fetched;
        sourceMeta.push(meta);
        if (meta.error) errors.push(`${source} (${keyword}): ${meta.error}`);

        for (const listing of listings) {
          const key = `${listing.source}:${listing.sourceId}`;
          if (listingKeys.has(key)) continue;
          listingKeys.add(key);
          mergedListings.push(listing);
        }
      }

      sourceCounts[source] = mergedListings.length;
      apifyMeta[source] = { keywords, runs: sourceMeta };

      const persist = await persistRawListings(supabase, mergedListings, runStartedAt, {
        profileFilter: options.profileFilter,
        employmentFilter: search.employments,
        sourcesToMarkStale: options.markStale === false ? undefined : [source],
      });

      inserted += persist.inserted;
      updated += persist.updated;
      skippedDuplicate += persist.skippedDuplicate;
      skippedNotRelevant += persist.skippedNotRelevant;
      skippedNotSouthAfrica += persist.skippedNotSouthAfrica;
      errors.push(...persist.errors);
      staleMarked += 0;
    }

    if (!options.skipRescore) {
      let profileQuery = supabase.from("candidate_profiles").select("*").eq("extraction_status", "confirmed");
      if (options.rescoreUserId) {
        profileQuery = profileQuery.eq("user_id", options.rescoreUserId);
      }
      const { data: profiles, error: profileError } = await profileQuery;
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
        source_counts: { ...sourceCounts, apify: apifyMeta, search },
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
      fetched,
      inserted,
      updated,
      skippedDuplicate,
      skippedNotRelevant,
      skippedNotSouthAfrica,
      staleMarked,
      rescoredUsers,
      sourceCounts,
      errors,
      apifySearch: search,
      sourcesRun,
      pnetSearch: search,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    await supabase
      .from("ingestion_runs")
      .update({ finished_at: new Date().toISOString(), errors })
      .eq("id", runId);
    throw error;
  }
}
