import { defaultSearchLocation, maxResultsPerSource } from "@/lib/jobs/apify-config";
import { runApifyActor } from "@/lib/jobs/sources/apify-shared";
import {
  type ApifyLinkedInDatasetItem,
  rawListingsFromLinkedInItems,
} from "@/lib/jobs/sources/linkedin-listing-map";

export type ApifyLinkedInActorInput = {
  jobs_titles?: string[];
  job_title?: string;
  location?: string;
  cities?: string[];
  scrape_mode?: "quick" | "detailed";
  jobs_entries?: number;
};

export function buildLinkedInActorInput(overrides?: Partial<ApifyLinkedInActorInput>): ApifyLinkedInActorInput {
  const keyword =
    overrides?.jobs_titles?.[0] ??
    overrides?.job_title ??
    (process.env.APIFY_LINKEDIN_QUERY?.trim() || "graduate");

  const location =
    overrides?.location ?? (process.env.APIFY_LINKEDIN_LOCATION?.trim() || defaultSearchLocation());

  return {
    jobs_titles: overrides?.jobs_titles ?? [keyword],
    location,
    scrape_mode: overrides?.scrape_mode ?? "quick",
    jobs_entries: overrides?.jobs_entries ?? Math.max(maxResultsPerSource(), 10),
    ...(overrides?.cities?.length ? { cities: overrides.cities } : {}),
  };
}

export async function fetchLinkedInListingsFromApify(options?: {
  input?: Partial<ApifyLinkedInActorInput>;
}) {
  const actorId = process.env.APIFY_LINKEDIN_ACTOR_ID?.trim();
  if (!actorId) throw new Error("APIFY_LINKEDIN_ACTOR_ID is not set.");

  const input = buildLinkedInActorInput(options?.input);
  const { items, runId, datasetId } = await runApifyActor<ApifyLinkedInDatasetItem>({
    actorId,
    input,
    label: "linkedin",
  });

  return {
    items,
    listings: rawListingsFromLinkedInItems(items),
    runId,
    datasetId,
    input,
  };
}
