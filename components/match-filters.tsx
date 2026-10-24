"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { searchJobs, type SearchJobsState } from "@/lib/actions/search-jobs";
import { LocationSuggestInput } from "@/components/location-suggest-input";
import { EmploymentTypeMultiSelect } from "@/components/employment-type-multi-select";
import { JobSearchProgress } from "@/components/job-search-progress";

const initial: SearchJobsState = { error: null };

const filterFieldClass =
  "mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-ink";

export function MatchFilters({
  defaults,
  jobIngestPaused = false,
}: {
  defaults: {
    q: string;
    location: string;
    employment: string[];
  };
  jobIngestPaused?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(searchJobs, initial);

  return (
    <>
      <JobSearchProgress active={pending && !jobIngestPaused} />
      <form action={action} className="grid gap-4 rounded-[1.25rem] border border-line bg-panel p-4 sm:grid-cols-2 lg:grid-cols-3">
      <p className="sm:col-span-2 lg:col-span-3 text-sm text-muted">
        {jobIngestPaused
          ? "Live job fetching is paused. Search filters your saved listings using title, location, and employment types."
          : "Search uses your title, location, and employment types (select any combination). Scores still use your confirmed profile."}
      </p>
      <label className="block text-sm">
        <span className="text-muted">Job title</span>
        <input
          name="q"
          defaultValue={defaults.q}
          placeholder="e.g. graduate developer"
          className={filterFieldClass}
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Location</span>
        <LocationSuggestInput
          name="location"
          defaultValue={defaults.location}
          placeholder="South Africa"
          className={filterFieldClass}
        />
      </label>
      <label className="block text-sm sm:col-span-2 lg:col-span-1">
        <span className="text-muted">Employment type</span>
        <EmploymentTypeMultiSelect
          defaultSelected={defaults.employment}
          className={filterFieldClass}
        />
      </label>
      <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
        >
          {pending ? (jobIngestPaused ? "Applying…" : "Searching…") : jobIngestPaused ? "Filter jobs" : "Search jobs"}
        </button>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm"
          onClick={() => router.push("/dashboard/matches")}
        >
          Clear
        </button>
      </div>
      {state.error ? <p className="sm:col-span-2 lg:col-span-3 text-sm text-warn">{state.error}</p> : null}
    </form>
    </>
  );
}
