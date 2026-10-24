import type { CandidateProfile } from "@/lib/profile";
import { buildPnetSearchFromProfile } from "@/lib/jobs/profile-pnet-search";

export type ApifyJobSource = "pnet" | "indeed" | "linkedin";

export const APIFY_JOB_SOURCES: ApifyJobSource[] = ["pnet", "indeed", "linkedin"];

const ACTOR_ENV: Record<ApifyJobSource, string> = {
  pnet: "APIFY_PNET_ACTOR_ID",
  indeed: "APIFY_INDEED_ACTOR_ID",
  linkedin: "APIFY_LINKEDIN_ACTOR_ID",
};

const ENABLE_ENV: Record<ApifyJobSource, string> = {
  pnet: "APIFY_ENABLE_PNET",
  indeed: "APIFY_ENABLE_INDEED",
  linkedin: "APIFY_ENABLE_LINKEDIN",
};

function envFlag(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/** When true, candidate "Search jobs" only filters saved listings — no Apify runs. */
export function isJobSearchPaused(): boolean {
  return envFlag("APIFY_JOB_SEARCH_PAUSED");
}

/** Source runs only when explicitly enabled and actor + token are configured. */
export function isApifySourceEnabled(source: ApifyJobSource): boolean {
  if (!envFlag(ENABLE_ENV[source])) return false;
  if (!process.env.APIFY_API_TOKEN?.trim()) return false;
  return Boolean(process.env[ACTOR_ENV[source]]?.trim());
}

export function enabledApifySources(): ApifyJobSource[] {
  return (["pnet", "indeed", "linkedin"] as ApifyJobSource[]).filter(isApifySourceEnabled);
}

export function maxResultsPerSource(): number {
  const raw = Number(process.env.APIFY_SYNC_MAX_PER_SOURCE ?? 5);
  if (!Number.isFinite(raw) || raw < 1) return 5;
  return Math.min(Math.floor(raw), 50);
}

/** LinkedIn actor requires at least 10 results per run. */
export function linkedInResultsCap(): number {
  return Math.max(maxResultsPerSource(), 10);
}

export function defaultIndeedCountry() {
  return process.env.APIFY_INDEED_COUNTRY?.trim() || "za";
}

export function defaultSearchLocation() {
  return process.env.APIFY_DEFAULT_LOCATION?.trim() || "South Africa";
}

export function buildApifySearchFromProfile(profile: CandidateProfile) {
  return buildPnetSearchFromProfile(profile);
}
