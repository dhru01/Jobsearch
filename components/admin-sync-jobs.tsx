"use client";

import { useActionState } from "react";
import { syncJobsAdmin, type SyncJobsState } from "@/lib/actions/admin-sync-jobs";

const initial: SyncJobsState = { error: null, ok: false, summary: null };

export function AdminSyncJobs() {
  const [state, action, pending] = useActionState(syncJobsAdmin, initial);

  return (
    <section className="rounded-[1.5rem] border border-line bg-panel p-5 sm:p-6">
      <h2 className="text-lg font-medium">Sync jobs (Apify)</h2>
      <p className="mt-2 text-sm text-muted">
        Manual test run for enabled sources (PNet, Indeed, LinkedIn). Uses your{" "}
        <strong className="font-medium text-ink">confirmed profile</strong> for search terms and relevance. Small batch
        per source (LinkedIn actor minimum 10 per run). Uses Apify credits. Nothing is scheduled automatically.
      </p>
      <form action={action} className="mt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Syncing…" : "Sync jobs"}
        </button>
      </form>
      {state.error ? <p className="mt-3 text-sm text-bad">{state.error}</p> : null}
      {state.ok && state.summary ? <p className="mt-3 text-sm text-good">{state.summary}</p> : null}
    </section>
  );
}
