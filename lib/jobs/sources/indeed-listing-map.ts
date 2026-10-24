import { stableIdFromUrl } from "@/lib/jobs/dedupe";
import type { RawListing } from "@/lib/jobs/types";

export const INDEED_SOURCE = "indeed";

export type ApifyIndeedDatasetItem = {
  id?: string;
  title?: string;
  viewJobLink?: string;
  originalApplyUrl?: string;
  companyDetails?: { name?: string };
  formattedLocation?: string;
  location?: string;
  jobLocationCity?: string;
  jobLocationState?: string;
  jobDescription?: string;
  jobTypes?: string[];
  attributes?: { label?: string }[];
  salary?: string | null;
  pubDate?: number;
};

function indeedJobUrl(item: ApifyIndeedDatasetItem, country = "za"): string | null {
  const link = item.originalApplyUrl?.trim() || item.viewJobLink?.trim();
  if (!link) return null;
  if (link.startsWith("http")) return link;
  const host = country === "za" ? "https://za.indeed.com" : `https://${country}.indeed.com`;
  return `${host}${link.startsWith("/") ? link : `/${link}`}`;
}

function parsePostedAt(pubDate?: number) {
  if (!pubDate) return null;
  const ms = pubDate > 1e12 ? pubDate : pubDate * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function mapIndeedItemToRawListing(
  item: ApifyIndeedDatasetItem,
  country = "za",
): RawListing | null {
  const title = item.title?.trim();
  const originalUrl = indeedJobUrl(item, country);
  if (!title || !originalUrl) return null;

  const company = item.companyDetails?.name?.trim() || "Unknown employer";
  const locationText =
    item.formattedLocation?.trim() ||
    [item.jobLocationCity, item.jobLocationState].filter(Boolean).join(", ") ||
    item.location?.trim() ||
    "South Africa";

  const employmentType =
    item.jobTypes?.[0]?.trim() ||
    item.attributes?.find((attr) => /full-time|part-time|contract|intern|temporary/i.test(attr.label ?? ""))
      ?.label?.trim() ||
    null;

  const sourceId = item.id?.trim() || stableIdFromUrl(originalUrl);

  return {
    source: INDEED_SOURCE,
    sourceId,
    originalUrl,
    title,
    company,
    description: item.jobDescription?.trim() ?? "",
    requirements: employmentType ? `Employment type: ${employmentType}` : "",
    locationText,
    postedAt: parsePostedAt(item.pubDate),
    employmentType,
    salaryText:
      item.salary != null && String(item.salary).trim() ? String(item.salary).trim() : null,
    raw: item as Record<string, unknown>,
  };
}

export function rawListingsFromIndeedItems(items: ApifyIndeedDatasetItem[], country = "za") {
  const listings: RawListing[] = [];
  for (const item of items) {
    const mapped = mapIndeedItemToRawListing(item, country);
    if (mapped) listings.push(mapped);
  }
  return listings;
}
