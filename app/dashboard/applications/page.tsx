import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { LoadingBlock } from "@/components/loading-block";
import { requireConfirmedProfile } from "@/lib/auth";
import { applicationStatusLabel, jobSourceLabel, one, formatScore } from "@/lib/labels";

export const instant = false;

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  match_score: number | string | null;
  jobs:
    | {
        title: string;
        company: string;
        source: string;
        original_url: string;
      }
    | {
        title: string;
        company: string;
        source: string;
        original_url: string;
      }[]
    | null;
};

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading applications" />}>
      <Applications />
    </Suspense>
  );
}

async function Applications() {
  await connection();
  const { supabase, user } = await requireConfirmedProfile();
  const { data } = await supabase
    .from("applications")
    .select("id, status, created_at, submitted_at, match_score, jobs(title, company, source, original_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as ApplicationRow[])
    .map((application) => ({ application, job: one(application.jobs) }))
    .filter((row) => row.job);

  const count = (status: string | string[]) =>
    rows.filter((row) => (Array.isArray(status) ? status.includes(row.application.status) : row.application.status === status)).length;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const submitted = rows.filter((row) => row.application.status === "submitted" || row.application.status === "unverified");
  const today = submitted.filter((row) => new Date(row.application.submitted_at ?? row.application.created_at) >= startOfDay).length;
  const week = submitted.filter((row) => new Date(row.application.submitted_at ?? row.application.created_at) >= weekAgo).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-accent">Applications</p>
        <h1 className="mt-2 text-4xl leading-none sm:text-5xl">Roles in progress</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Submitted means we have evidence (mock worker or you confirmed). Unverified means you applied on the employer
          site yourself.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Submitted (evidenced + unverified)" value={String(submitted.length)} />
        <Stat label="Today" value={String(today)} />
        <Stat label="This week" value={String(week)} />
        <Stat label="Awaiting approval" value={String(count("awaiting_approval"))} />
        <Stat label="Needs attention" value={String(count(["action_required", "failed"]))} />
        <Stat label="Interviews / offers" value={String(count(["interview", "offer"]))} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[1.5rem] border border-line bg-raised p-6 text-sm text-muted">
          <p>No applications yet.</p>
          <Link href="/dashboard/matches" className="mt-3 inline-block text-ink underline decoration-accent underline-offset-4">
            Browse matches
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[1.5rem] border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-panel text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Job title</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Match</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ application, job }) =>
                job ? (
                  <tr key={application.id} className="border-t border-line">
                    <td className="px-4 py-3">{job.company}</td>
                    <td className="px-4 py-3">{job.title}</td>
                    <td className="px-4 py-3">{jobSourceLabel(job.source)}</td>
                    <td className="px-4 py-3">
                      {application.match_score != null ? formatScore(Number(application.match_score)) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(application.submitted_at ?? application.created_at).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-4 py-3">{applicationStatusLabel(application.status)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/applications/${application.id}`} className="text-accent underline-offset-4 hover:underline">
                        {application.status === "awaiting_approval" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-line bg-raised px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl leading-none">{value}</p>
    </div>
  );
}
