import { stableIdFromUrl } from "@/lib/jobs/dedupe";
import type { RawListing } from "@/lib/jobs/types";

export const PNET_SOURCE = "pnet";
export const PNET_DEFAULT_RESULTS_WANTED = 20;

export type ApifyPnetDatasetItem = {
  job_id?: string;
  title?: string;
  job_url?: string;
  company?: string;
  location?: string;
  date_posted?: string;
  description_text?: string;
  description_html?: string;
  benefits_text?: string;
  job_type?: string;
  job_category?: string;
  skills?: string[];
  salary?: string;
  work_from_home?: boolean;
  scraped_at?: string;
};

function parsePostedAt(value: string | undefined, scrapedAt?: string) {
  if (value) {
    const lower = value.toLowerCase();
    const now = new Date();
    if (lower.includes("hour")) {
      const hours = Number(lower.match(/(\d+)/)?.[1] ?? 1);
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }
    if (lower.includes("day")) {
      const days = Number(lower.match(/(\d+)/)?.[1] ?? 1);
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    if (lower.includes("week")) {
      const weeks = Number(lower.match(/(\d+)/)?.[1] ?? 1);
      return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
    }
    if (lower.includes("month")) {
      const months = Number(lower.match(/(\d+)/)?.[1] ?? 1);
      return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
    }
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  if (scrapedAt) {
    const parsed = Date.parse(scrapedAt);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return null;
}

export function mapPnetItemToRawListing(item: ApifyPnetDatasetItem): RawListing | null {
  const title = item.title?.trim();
  const company = item.company?.trim() || "Unknown employer";
  const originalUrl = item.job_url?.trim();
  if (!title || !originalUrl) return null;

  const skills = Array.isArray(item.skills) ? item.skills.filter(Boolean) : [];
  const descriptionParts = [
    item.description_text?.trim(),
    item.benefits_text?.trim(),
    item.salary?.trim() ? `Salary: ${item.salary.trim()}` : "",
    item.job_type?.trim() ? `Employment type: ${item.job_type.trim()}` : "",
    item.work_from_home ? "Work from home: yes" : "",
  ].filter(Boolean);

  const requirementsParts = [
    item.job_category?.trim(),
    skills.length ? `Skills: ${skills.join(", ")}` : "",
  ].filter(Boolean);

  const sourceId = item.job_id?.trim() || stableIdFromUrl(originalUrl);

  return {
    source: PNET_SOURCE,
    sourceId,
    originalUrl,
    title,
    company,
    description: descriptionParts.join("\n\n"),
    requirements: requirementsParts.join("\n"),
    locationText: item.location?.trim() || "South Africa",
    postedAt: parsePostedAt(item.date_posted, item.scraped_at),
    employmentType: item.job_type?.trim() || null,
    salaryText: item.salary?.trim() || null,
    raw: item as Record<string, unknown>,
  };
}

export function rawListingsFromApifyItems(items: ApifyPnetDatasetItem[]) {
  const listings: RawListing[] = [];
  for (const item of items) {
    const mapped = mapPnetItemToRawListing(item);
    if (mapped) listings.push(mapped);
  }
  return listings;
}
