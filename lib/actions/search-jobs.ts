"use server";

import { redirect } from "next/navigation";
import { requireConfirmedProfile } from "@/lib/auth";
import { buildApifySearchFromFilters } from "@/lib/jobs/apify-search-from-filters";
import { parseEmploymentFilters } from "@/lib/jobs/employment-type-options";
import {
  APIFY_JOB_SOURCES,
  enabledApifySources,
  isApifySourceEnabled,
  isJobSearchPaused,
  type ApifyJobSource,
} from "@/lib/jobs/apify-config";
import { runApifyJobSync } from "@/lib/jobs/ingest-apify";
import { ApifyNotConfiguredError } from "@/lib/jobs/sources/apify-shared";

export type SearchJobsState = {
  error: string | null;
};

const empty: SearchJobsState = { error: null };

function isApifySource(value: string): value is ApifyJobSource {
  return (APIFY_JOB_SOURCES as string[]).includes(value);
}

function redirectWithFilters(form: {
  q: string;
  locationInput: string;
  sourceInput: string;
  employment: string[];
  salaryMin: string;
}) {
  const next = new URLSearchParams();
  if (form.q) next.set("q", form.q);
  if (form.locationInput) next.set("location", form.locationInput);
  if (form.sourceInput) next.set("source", form.sourceInput);
  for (const value of form.employment) next.append("employment", value);
  if (form.salaryMin) next.set("salary_min", form.salaryMin);
  redirect(`/dashboard/matches?${next.toString()}`);
}

/** Confirmed users: scrape enabled sources from the Find jobs form, then score against the profile. */
export async function searchJobs(_prev: SearchJobsState, formData: FormData): Promise<SearchJobsState> {
  const { user, profile } = await requireConfirmedProfile();

  const q = String(formData.get("q") ?? "").trim();
  const locationInput = String(formData.get("location") ?? "").trim();
  const sourceInput = String(formData.get("source") ?? "").trim();
  const employment = parseEmploymentFilters(formData.getAll("employment").map(String));
  const salaryMin = String(formData.get("salary_min") ?? "").trim();

  const filterRedirect = () =>
    redirectWithFilters({ q, locationInput, sourceInput, employment, salaryMin });

  if (isJobSearchPaused()) {
    filterRedirect();
    return empty;
  }

  const enabled = enabledApifySources();
  if (enabled.length === 0) {
    return { error: "Job search is not configured. Set APIFY_API_TOKEN and enable at least one source." };
  }

  if (sourceInput && isApifySource(sourceInput) && !isApifySourceEnabled(sourceInput)) {
    return { error: `${sourceInput} is not enabled on the server.` };
  }

  const sources: ApifyJobSource[] =
    sourceInput && isApifySource(sourceInput)
      ? enabled.filter((source) => source === sourceInput)
      : enabled;

  const search = buildApifySearchFromFilters(
    { q, location: locationInput, employment },
    profile,
  );

  try {
    await runApifyJobSync({
      profile,
      searchOverride: search,
      sources,
      rescoreUserId: user.id,
      markStale: false,
    });
  } catch (error) {
    if (error instanceof ApifyNotConfiguredError) {
      return { error: error.message };
    }
    console.error("Candidate job search ingest failed", error);
    return { error: error instanceof Error ? error.message : "Job search failed." };
  }

  filterRedirect();
  return empty;
}
