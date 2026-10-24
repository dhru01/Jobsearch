import type { MatchRow } from "@/lib/jobs/match-types";

export type MatchFilterParams = {
  q?: string;
  location?: string;
  source?: string;
  employment?: string | string[];
  salary_min?: string;
};

import { normalizeMatchText } from "@/lib/jobs/apify-search-from-filters";
import { parseEmploymentFilters } from "@/lib/jobs/employment-type-options";

function matchesText(haystack: string, needle: string) {
  return normalizeMatchText(haystack).includes(normalizeMatchText(needle));
}

export function jobMatchesEmploymentFilter(
  job: { employment_type?: string | null; title?: string | null },
  employment: string,
) {
  const needle = employment.trim();
  if (!needle) return true;
  const haystack = `${job.employment_type ?? ""} ${job.title ?? ""}`;
  return matchesText(haystack, needle);
}

export function jobMatchesEmploymentFilters(
  job: { employment_type?: string | null; title?: string | null },
  employments: string[],
) {
  if (employments.length === 0) return true;
  return employments.some((employment) => jobMatchesEmploymentFilter(job, employment));
}

export function filterMatchRows(rows: MatchRow[], filters: MatchFilterParams) {
  const q = filters.q?.trim();
  const location = filters.location?.trim();
  const source = filters.source?.trim();
  const employments = parseEmploymentFilters(filters.employment);
  const salaryMinRaw = filters.salary_min?.trim();
  const salaryMin = salaryMinRaw ? Number(salaryMinRaw) : null;

  return rows.filter(({ job }) => {
    if (q && !matchesText(`${job.title} ${job.company}`, q)) return false;
    if (location && !matchesText(job.location, location)) return false;
    if (source && job.source !== source) return false;
    if (!jobMatchesEmploymentFilters(job, employments)) return false;
    if (salaryMin != null && Number.isFinite(salaryMin)) {
      if (job.salary_min == null || job.salary_min < salaryMin) return false;
    }
    return true;
  });
}
