import { runApifyActor, ApifyNotConfiguredError } from "@/lib/jobs/sources/apify-shared";
import {
  type ApifyPnetDatasetItem,
  PNET_DEFAULT_RESULTS_WANTED,
  rawListingsFromApifyItems,
} from "@/lib/jobs/sources/pnet-listing-map";

export {
  mapPnetItemToRawListing,
  PNET_DEFAULT_RESULTS_WANTED,
  PNET_SOURCE,
  rawListingsFromApifyItems,
  type ApifyPnetDatasetItem,
} from "@/lib/jobs/sources/pnet-listing-map";

export { ApifyNotConfiguredError };

export type ApifyPnetActorInput = {
  startUrl?: string;
  keyword?: string;
  location?: string;
  postedWithin?: number | string;
  results_wanted?: number;
  max_pages?: number;
  proxyConfiguration?: Record<string, unknown>;
};

export function buildPnetActorInput(overrides?: Partial<ApifyPnetActorInput>): ApifyPnetActorInput {
  const keyword = overrides?.keyword ?? process.env.APIFY_PNET_KEYWORD ?? "graduate";
  const resultsWanted = overrides?.results_wanted ?? PNET_DEFAULT_RESULTS_WANTED;

  return {
    keyword,
    location: overrides?.location ?? process.env.APIFY_PNET_LOCATION ?? "South Africa",
    results_wanted: resultsWanted,
    max_pages: overrides?.max_pages ?? 3,
    ...(overrides?.postedWithin != null ? { postedWithin: overrides.postedWithin } : {}),
    ...(overrides?.startUrl ? { startUrl: overrides.startUrl } : {}),
    proxyConfiguration: overrides?.proxyConfiguration ?? {},
  };
}

/** Runs the configured PNet Actor and returns dataset items (does not write to Supabase). */
export async function fetchPnetListingsFromApify(options?: {
  input?: Partial<ApifyPnetActorInput>;
}): Promise<{ items: ApifyPnetDatasetItem[]; runId: string; datasetId: string }> {
  const actorId = process.env.APIFY_PNET_ACTOR_ID?.trim();
  if (!actorId) throw new ApifyNotConfiguredError();

  const input = buildPnetActorInput(options?.input);
  const { items, runId, datasetId } = await runApifyActor<ApifyPnetDatasetItem>({
    actorId,
    input,
    label: "pnet",
  });

  return { items, runId, datasetId };
}
