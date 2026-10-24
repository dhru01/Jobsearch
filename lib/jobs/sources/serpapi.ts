import { stableIdFromUrl } from "@/lib/jobs/dedupe";
import type { RawListing } from "@/lib/jobs/types";

type SerpJob = {
  job_id?: string;
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  via?: string;
  detected_extensions?: { posted_at?: string; schedule_type?: string };
  apply_options?: { link?: string }[];
  share_link?: string;
  job_highlights?: { title?: string; items?: string[] }[];
};

type SerpResponse = {
  jobs_results?: SerpJob[];
  error?: string;
  serpapi_pagination?: { next_page_token?: string };
};

const DEFAULT_QUERIES = [
  "graduate software developer South Africa",
  "junior developer South Africa",
  "graduate analyst South Africa",
  "internship South Africa",
  "entry level engineer South Africa",
  "junior data analyst South Africa",
  "graduate accountant South Africa",
  "customer support graduate South Africa",
];

function parsePostedAt(value: string | undefined) {
  if (!value) return null;
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
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function toRawListing(job: SerpJob): RawListing | null {
  const title = job.title?.trim();
  const company = job.company_name?.trim() || job.via?.trim();
  const locationText = job.location?.trim() || "South Africa";
  const originalUrl =
    job.apply_options?.find((item) => item.link)?.link?.trim() ||
    job.share_link?.trim() ||
    "";
  if (!title || !company || !originalUrl) return null;

  const highlights =
    job.job_highlights?.flatMap((block) => block.items ?? []).filter(Boolean) ?? [];

  const sourceId = job.job_id?.trim() || stableIdFromUrl(originalUrl);

  return {
    source: "serpapi",
    sourceId,
    originalUrl,
    title,
    company,
    description: job.description?.trim() || highlights.join("\n"),
    requirements: highlights.join("\n"),
    locationText,
    postedAt: parsePostedAt(job.detected_extensions?.posted_at),
    raw: job as Record<string, unknown>,
  };
}

async function fetchPage(apiKey: string, params: Record<string, string>) {
  const search = new URLSearchParams({ api_key: apiKey, engine: "google_jobs", ...params });
  const response = await fetch(`https://serpapi.com/search.json?${search.toString()}`, {
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) {
    throw new Error(`SerpAPI HTTP ${response.status}`);
  }
  const json = (await response.json()) as SerpResponse;
  if (json.error) {
    const empty =
      json.error.includes("hasn't returned any results") || json.error.includes("has not returned any results");
    if (empty) return { jobs_results: [] };
    throw new Error(json.error);
  }
  return json;
}

export async function fetchSerpApiListings(options?: {
  apiKey?: string;
  queries?: string[];
  maxPerQuery?: number;
  maxTotal?: number;
}) {
  const apiKey = options?.apiKey ?? process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not set. Add it to .env.local or pass --fixtures for offline ingest.");
  }

  const queries = options?.queries ?? DEFAULT_QUERIES;
  const maxPerQuery = options?.maxPerQuery ?? 80;
  const maxTotal = options?.maxTotal ?? Number(process.env.INGEST_JOB_CAP ?? 1000);

  const listings: RawListing[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    let nextToken: string | undefined;
    let fetchedForQuery = 0;

    while (fetchedForQuery < maxPerQuery && listings.length < maxTotal) {
      const page = await fetchPage(apiKey, {
        q: query,
        location: "South Africa",
        hl: "en",
        gl: "za",
        ...(nextToken ? { next_page_token: nextToken } : {}),
      });

      const batch = (page.jobs_results ?? [])
        .map(toRawListing)
        .filter((item): item is RawListing => item != null);

      for (const item of batch) {
        const key = `${item.source}:${item.sourceId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        listings.push(item);
        fetchedForQuery += 1;
        if (listings.length >= maxTotal) break;
      }

      nextToken = page.serpapi_pagination?.next_page_token;
      if (!nextToken || batch.length === 0) break;
    }
  }

  return listings;
}
