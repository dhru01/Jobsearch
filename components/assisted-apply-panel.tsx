"use client";

import { useActionState } from "react";
import {
  reportApplicationSubmission,
  withdrawApplication,
  type ApplicationActionState,
} from "@/lib/actions/applications";
import { applicationStatusLabel } from "@/lib/labels";

const initial: ApplicationActionState = { error: null, ok: false };

type Step = {
  id: string;
  label: string;
  done: boolean;
};

function buildSteps(status: string, hasDocuments: boolean): Step[] {
  const prepared = ["prepared", "opened", "unverified", "submitted"].includes(status);
  const opened = ["opened", "unverified", "submitted"].includes(status);
  const reported = ["unverified", "submitted"].includes(status);

  return [
    { id: "save", label: "Save the role", done: true },
    { id: "docs", label: "Generate and review tailored documents", done: prepared },
    { id: "open", label: "Open the employer site and apply with your PDFs", done: opened },
    { id: "confirm", label: "Tell Fieldwork you submitted (we cannot verify this)", done: reported },
  ];
}

export function AssistedApplyPanel({
  applicationId,
  status,
  hasDocuments,
  notes,
}: {
  applicationId: string;
  status: string;
  hasDocuments: boolean;
  notes: string | null;
}) {
  const [reportState, reportAction, reportPending] = useActionState(reportApplicationSubmission, initial);
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(withdrawApplication, initial);

  const steps = buildSteps(status, hasDocuments);
  const terminal = status === "withdrawn" || status === "rejected";

  return (
    <section className="rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">Assisted apply</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Fieldwork prepares documents and tracks your progress. You always submit on the employer&apos;s site.
            Status: <strong className="font-medium text-ink">{applicationStatusLabel(status)}</strong>
          </p>
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-3 text-sm">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                step.done ? "bg-good-bg text-good" : "bg-panel text-muted"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </span>
            <span className={step.done ? "text-ink" : "text-muted"}>{step.label}</span>
          </li>
        ))}
      </ol>

      {status === "unverified" ? (
        <p className="mt-5 rounded-2xl bg-panel px-4 py-3 text-sm text-muted">
          Marked as <strong className="text-ink">submitted (unverified)</strong> — Fieldwork did not submit this
          application and cannot confirm the employer received it.
        </p>
      ) : null}

      {!terminal && hasDocuments && ["prepared", "opened", "draft"].includes(status) ? (
        <form action={reportAction} className="mt-6 space-y-4">
          <input type="hidden" name="application_id" value={applicationId} />
          <label className="block text-sm">
            <span className="text-muted">Optional note (for your records)</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={notes ?? ""}
              placeholder="e.g. Applied via company careers portal on 23 Oct"
              className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={reportPending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {reportPending ? "Saving…" : "I submitted on the employer site"}
          </button>
          {reportState.error ? <p className="text-sm text-warn">{reportState.error}</p> : null}
          {reportState.ok ? (
            <p className="text-sm text-good">Saved. This remains unverified until the employer confirms.</p>
          ) : null}
        </form>
      ) : null}

      {!terminal && status !== "unverified" ? (
        <form action={withdrawAction} className="mt-4">
          <input type="hidden" name="application_id" value={applicationId} />
          <button
            type="submit"
            disabled={withdrawPending}
            className="text-sm text-muted underline-offset-4 hover:underline disabled:opacity-60"
          >
            Withdraw from this role
          </button>
          {withdrawState.error ? <p className="mt-2 text-sm text-warn">{withdrawState.error}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
