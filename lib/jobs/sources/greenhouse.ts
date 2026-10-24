import { stableIdFromUrl } from "@/lib/jobs/dedupe";
import { isSouthAfricanListing } from "@/lib/jobs/location";
import type { RawListing } from "@/lib/jobs/types";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location?: { name?: string };
  content?: string;
  departments?: { name?: string }[];
};

type GreenhouseResponse = { jobs: GreenhouseJob[] };

export async function fetchGreenhouseListings(boardTokens: string[]) {
  const listings: RawListing[] = [];

  for (const board of boardTokens) {
    const token = board.trim();
    if (!token) continue;
    const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`Greenhouse board "${token}" returned HTTP ${response.status}`);
    }
    const json = (await response.json()) as GreenhouseResponse;
    for (const job of json.jobs ?? []) {
      const locationText = job.location?.name?.trim() || "South Africa";
      const description = job.content?.trim() || "";
      if (!isSouthAfricanListing(locationText, description)) continue;

      const originalUrl = job.absolute_url?.trim();
      if (!originalUrl) continue;

      listings.push({
        source: "greenhouse",
        sourceId: String(job.id),
        originalUrl,
        title: job.title.trim(),
        company: token,
        description,
        requirements: "",
        locationText,
        postedAt: job.updated_at ? new Date(job.updated_at) : null,
        raw: job as Record<string, unknown>,
      });
    }
  }

  return listings;
}

export function parseGreenhouseBoardsFromEnv(value: string | undefined) {
  if (!value?.trim()) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
