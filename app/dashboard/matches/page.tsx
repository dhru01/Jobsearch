import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/loading-block";
import { MatchFilters } from "@/components/match-filters";
import { saveApplication } from "@/lib/actions/applications";
import { requireConfirmedProfile } from "@/lib/auth";
import { isJobSearchPaused } from "@/lib/jobs/apify-config";
import { parseEmploymentFilters } from "@/lib/jobs/employment-type-options";
import { filterMatchRows } from "@/lib/jobs/match-filters";
import type { MatchRow } from "@/lib/jobs/match-types";
import { formatScore, one, roundScoreDisplay, workModeLabel } from "@/lib/labels";

export const instant = false;
export const maxDuration = 180;

type Breakdown = {
  qualifications?: number;
  skills?: number;
  experience?: number;
  location?: number;
  preferences?: number;
  missingSkills?: string[];
};

type DbMatchRow = {
  id: string;
  score: number | string;
  eligibility_pass: boolean;
  eligibility_reasons: string[] | null;
  breakdown: Breakdown | null;
  jobs:
    | {
        id: string;
        title: string;
        company: string;
        location: string;
        original_url: string;
        work_mode: string;
        is_stale: boolean;
        source: string;
        employment_type: string | null;
        salary_text: string | null;
        salary_min: number | null;
      }
    | {
        id: string;
        title: string;
        company: string;
        location: string;
        original_url: string;
        work_mode: string;
        is_stale: boolean;
        source: string;
        employment_type: string | null;
        salary_text: string | null;
        salary_min: number | null;
      }[]
    | null;
};

const PARTS: { key: keyof Breakdown; label: string; weight: string }[] = [
  { key: "qualifications", label: "Qualifications", weight: "30%" },
  { key: "skills", label: "Skills", weight: "30%" },
  { key: "experience", label: "Experience", weight: "20%" },
  { key: "location", label: "Location", weight: "10%" },
  { key: "preferences", label: "Preferences", weight: "10%" },
];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function MatchesPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading matches" />}>
      <Matches searchParams={searchParams} />
    </Suspense>
  );
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function Matches({ searchParams }: PageProps) {
  await connection();
  const params = await searchParams;
  const filters = {
    q: param(params.q),
    location: param(params.location),
    source: param(params.source),
    employment: parseEmploymentFilters(params.employment),
    salary_min: param(params.salary_min),
  };

  const { supabase, user } = await requireConfirmedProfile();
  const [{ data: matches }, { data: applications }] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, score, eligibility_pass, eligibility_reasons, breakdown, jobs(id, title, company, location, original_url, work_mode, is_stale, source, employment_type, salary_text, salary_min)",
      )
      .eq("user_id", user.id),
    supabase.from("applications").select("id, job_id").eq("user_id", user.id),
  ]);

  const saved = new Map(
    (applications ?? []).map((application) => [application.job_id as string, application.id as string]),
  );

  const allRows: MatchRow[] = ((matches ?? []) as DbMatchRow[]).flatMap((match) => {
    const job = one(match.jobs);
    return job
      ? [
          {
            match: {
              id: match.id,
              score: match.score,
              eligibility_pass: match.eligibility_pass,
              eligibility_reasons: match.eligibility_reasons,
              breakdown: match.breakdown,
            },
            job,
          },
        ]
      : [];
  });

  const rows = filterMatchRows(allRows, filters).sort((a, b) => {
    if (a.match.eligibility_pass !== b.match.eligibility_pass) return a.match.eligibility_pass ? -1 : 1;
    if (a.job.is_stale !== b.job.is_stale) return a.job.is_stale ? 1 : -1;
    return Number(b.match.score) - Number(a.match.score);
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-accent">Matches</p>
        <h1 className="mt-2 text-4xl leading-none sm:text-5xl">The shortlist</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Search with the fields below. Scores use your confirmed profile (qualifications 30%, skills 30%, experience
          20%, location 10%, preferences 10%).
        </p>
      </header>
      <Suspense fallback={null}>
        <MatchFilters
          jobIngestPaused={isJobSearchPaused()}
          defaults={{
            q: filters.q ?? "",
            location: filters.location ?? "",
            employment: filters.employment,
          }}
        />
      </Suspense>
      {rows.length === 0 ? (
        <p className="rounded-[1.5rem] border border-line bg-raised p-6 text-sm text-muted">
          No suggestions yet. Enter a job title and location, then search. We fetch live vacancies and score them
          against your confirmed profile.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map(({ match, job }) => {
            const breakdown = (match.breakdown ?? {}) as Breakdown;
            const reasons = Array.isArray(match.eligibility_reasons) ? match.eligibility_reasons : [];
            return (
              <li key={match.id} className="rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 max-w-2xl">
                    <p className="font-display text-2xl leading-none text-accent-2 sm:text-[1.75rem]">{job.company}</p>
                    <h2 className="mt-2 text-lg font-medium leading-snug text-ink sm:text-xl">{job.title}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {job.location} · {workModeLabel(job.work_mode)}
                    </p>
                    {job.salary_text ? <p className="mt-1 text-sm text-muted">{job.salary_text}</p> : null}
                    {job.employment_type ? (
                      <p className="mt-1 text-sm text-muted">{job.employment_type}</p>
                    ) : null}
                  </div>
                  <p
                    className={`font-display text-5xl leading-none ${match.eligibility_pass ? "text-accent" : "text-muted"}`}
                  >
                    {formatScore(Number(match.score))}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full px-2.5 py-1 font-medium ${
                      match.eligibility_pass ? "bg-good-bg text-good" : "bg-warn-bg text-warn"
                    }`}
                  >
                    {match.eligibility_pass ? "Eligible" : "Not eligible"}
                  </span>
                  {job.is_stale ? (
                    <span className="rounded-full bg-panel px-2.5 py-1 text-muted">May be stale</span>
                  ) : null}
                </div>
                <dl className="mt-5 grid gap-3 sm:grid-cols-5">
                  {PARTS.map((part) => {
                    const value = roundScoreDisplay(Number(breakdown[part.key] ?? 0));
                    return (
                      <div key={part.key}>
                        <dt className="text-xs text-muted">
                          {part.label} · {part.weight}
                        </dt>
                        <dd className="mt-1 text-sm font-medium">{value}</dd>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </dl>
                {breakdown.missingSkills && breakdown.missingSkills.length > 0 ? (
                  <p className="mt-3 text-sm text-muted">
                    Skills not on your confirmed profile: {breakdown.missingSkills.join(", ")}
                  </p>
                ) : null}
                <ul className="mt-3 space-y-1 text-sm text-ink">
                  {reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-3">
                  {saved.has(job.id) ? (
                    <Link
                      href={`/dashboard/applications/${saved.get(job.id)}`}
                      className="rounded-full border border-line bg-bg px-4 py-2 text-sm"
                    >
                      Prepare
                    </Link>
                  ) : (
                    <form action={saveApplication}>
                      <input type="hidden" name="job_id" value={job.id} />
                      <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white">
                        Save role
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
