import { defaultSearchLocation } from "@/lib/jobs/apify-config";
import { parseEmploymentFilters } from "@/lib/jobs/employment-type-options";
import { buildPnetSearchFromProfile } from "@/lib/jobs/profile-pnet-search";
import type { CandidateProfile } from "@/lib/profile";

export type JobSearchFilters = {
  q?: string;
  location?: string;
  employment?: string | string[];
};

export type ApifySearchTerms = {
  keyword: string;
  location: string;
  /** Selected employment types (OR when filtering ingested rows). */
  employments?: string[];
};

export function normalizeMatchText(value: string) {
  return value.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
}

function keywordAlreadyIncludesEmployment(keyword: string, employment: string) {
  const haystack = normalizeMatchText(keyword);
  const needle = normalizeMatchText(employment);
  if (!needle) return true;
  if (haystack.includes(needle)) return true;
  return needle
    .split(" ")
    .filter((part) => part.length >= 3)
    .every((part) => haystack.includes(part));
}

/** Distinct Apify keyword queries — one per selected employment type when needed. */
export function apifySearchKeywords(search: ApifySearchTerms): string[] {
  const employments = search.employments ?? [];
  if (employments.length === 0) return [search.keyword];

  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const employment of employments) {
    let next = search.keyword;
    if (!keywordAlreadyIncludesEmployment(search.keyword, employment)) {
      next = `${search.keyword} ${employment}`.replace(/\s+/g, " ").trim();
    }
    const key = normalizeMatchText(next);
    if (seen.has(key)) continue;
    seen.add(key);
    keywords.push(next);
  }

  return keywords.length > 0 ? keywords : [search.keyword];
}

/** Map form filters to Apify actor keyword + location. */
export function buildApifySearchFromFilters(
  filters: JobSearchFilters,
  profile: CandidateProfile,
): ApifySearchTerms {
  const q = filters.q?.trim() ?? "";
  const locationInput = filters.location?.trim() ?? "";
  const employments = parseEmploymentFilters(filters.employment);

  const fromProfile = buildPnetSearchFromProfile(profile);

  const keyword =
    q ||
    fromProfile.keyword ||
    process.env.APIFY_DEFAULT_KEYWORD?.trim() ||
    "graduate";

  const location =
    locationInput || fromProfile.location?.trim() || defaultSearchLocation();

  return {
    keyword,
    location,
    ...(employments.length > 0 ? { employments } : {}),
  };
}
