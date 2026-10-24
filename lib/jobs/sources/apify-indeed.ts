import {
  defaultIndeedCountry,
  maxResultsPerSource,
} from "@/lib/jobs/apify-config";
import { runApifyActor } from "@/lib/jobs/sources/apify-shared";
import {
  type ApifyIndeedDatasetItem,
  rawListingsFromIndeedItems,
} from "@/lib/jobs/sources/indeed-listing-map";

export type ApifyIndeedActorInput = {
  country?: string;
  query?: string;
  location?: string;
  radiusKm?: number;
  postedWithinDays?: string;
  count?: number;
};

export function buildIndeedActorInput(overrides?: Partial<ApifyIndeedActorInput>): ApifyIndeedActorInput {
  const count = overrides?.count ?? maxResultsPerSource();
  return {
    country: overrides?.country ?? defaultIndeedCountry(),
    query: overrides?.query ?? (process.env.APIFY_INDEED_QUERY?.trim() || "graduate"),
    location: overrides?.location ?? (process.env.APIFY_INDEED_LOCATION?.trim() || "South Africa"),
    radiusKm: overrides?.radiusKm ?? 25,
    count,
    ...(overrides?.postedWithinDays ? { postedWithinDays: overrides.postedWithinDays } : {}),
  };
}

export async function fetchIndeedListingsFromApify(options?: {
  input?: Partial<ApifyIndeedActorInput>;
}) {
  const actorId = process.env.APIFY_INDEED_ACTOR_ID?.trim();
  if (!actorId) throw new Error("APIFY_INDEED_ACTOR_ID is not set.");

  const input = buildIndeedActorInput(options?.input);
  const { items, runId, datasetId } = await runApifyActor<ApifyIndeedDatasetItem>({
    actorId,
    input,
    label: "indeed",
  });

  return {
    items,
    listings: rawListingsFromIndeedItems(items, input.country ?? "za"),
    runId,
    datasetId,
    input,
  };
}
