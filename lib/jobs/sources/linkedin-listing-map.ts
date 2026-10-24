import { stableIdFromUrl } from "@/lib/jobs/dedupe";
import type { RawListing } from "@/lib/jobs/types";

export const LINKEDIN_SOURCE = "linkedin";

export type ApifyLinkedInDatasetItem = {
  job_id?: string;
  job_url?: string;
  job_title?: string;
  company_name?: string;
  location?: string;
  time_posted?: string;
  posted_date?: string;
  salary_range?: string | null;
  job_description?: string;
  employment_type?: string;
  seniority_level?: string;
  industries?: string;
};

function parsePostedAt(item: ApifyLinkedInDatasetItem) {
  if (item.posted_date) {
    const parsed = Date.parse(item.posted_date);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  const relative = item.time_posted?.toLowerCase() ?? "";
  const now = new Date();
  if (relative.includes("hour")) {
    const hours = Number(relative.match(/(\d+)/)?.[1] ?? 1);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }
  if (relative.includes("day")) {
    const days = Number(relative.match(/(\d+)/)?.[1] ?? 1);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  return null;
}

export function mapLinkedInItemToRawListing(item: ApifyLinkedInDatasetItem): RawListing | null {
  const title = item.job_title?.trim();
  const originalUrl = item.job_url?.trim();
  if (!title || !originalUrl) return null;

  const company = item.company_name?.trim() || "Unknown employer";
  const sourceId = item.job_id?.trim() || stableIdFromUrl(originalUrl);
  const requirementsParts = [
    item.seniority_level?.trim(),
    item.industries?.trim(),
    item.employment_type?.trim() ? `Employment type: ${item.employment_type.trim()}` : "",
  ].filter(Boolean);

  return {
    source: LINKEDIN_SOURCE,
    sourceId,
    originalUrl,
    title,
    company,
    description: item.job_description?.trim() ?? "",
    requirements: requirementsParts.join("\n"),
    locationText: item.location?.trim() || "South Africa",
    postedAt: parsePostedAt(item),
    employmentType: item.employment_type?.trim() || null,
    salaryText: item.salary_range?.trim() || null,
    raw: item as Record<string, unknown>,
  };
}

export function rawListingsFromLinkedInItems(items: ApifyLinkedInDatasetItem[]) {
  const listings: RawListing[] = [];
  for (const item of items) {
    const mapped = mapLinkedInItemToRawListing(item);
    if (mapped) listings.push(mapped);
  }
  return listings;
}
