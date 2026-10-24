import { runApifyJobSync, type ApifySyncOptions } from "@/lib/jobs/ingest-apify";
import type { IngestionResult } from "@/lib/jobs/types";
import type { ProfileInput } from "@/lib/validation/profile";
import type { CandidateProfile } from "@/lib/profile";

export type PnetIngestOptions = {
  skipRescore?: boolean;
  resultsWanted?: number;
  keyword?: string;
  location?: string;
  profileFilter?: ProfileInput;
  profile?: CandidateProfile;
  pnetSearch?: { keyword: string; location: string };
};

/** @deprecated Prefer runApifyJobSync — kept for existing imports. */
export async function runPnetApifyIngestion(options: PnetIngestOptions = {}): Promise<IngestionResult> {
  const searchOverride =
    options.pnetSearch ??
    (options.keyword
      ? { keyword: options.keyword, location: options.location ?? "South Africa" }
      : undefined);

  return runApifyJobSync({
    skipRescore: options.skipRescore,
    profileFilter: options.profileFilter,
    profile: options.profile,
    searchOverride,
    sources: ["pnet"],
  });
}
