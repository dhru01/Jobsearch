"use client";

import { useActionState } from "react";
import {
  approveAndQueueApplication,
  prepareApplicationAnswers,
  updateApplicationStatus,
  type AutoApplyState,
} from "@/lib/actions/auto-apply";

const initial: AutoApplyState = { error: null, ok: false, note: null };

type Answer = {
  id: string;
  question: string;
  answer: string;
  needs_user: boolean;
  source: string;
};

export function ApplicationAnswersPanel({
  applicationId,
  answers,
  workflow,
  errorMessage,
}: {
  applicationId: string;
  answers: Answer[];
  workflow: string;
  errorMessage: string | null;
}) {
  const [state, action, pending] = useActionState(prepareApplicationAnswers, initial);

  return (
    <section className="rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
      <h2 className="text-xl">Application answers</h2>
      <p className="mt-2 text-sm text-muted">
        Generated from your confirmed profile. Workflow: <strong className="text-ink">{workflow}</strong>. PNet /
        LinkedIn / Indeed stay assisted.
      </p>
      {errorMessage ? <p className="mt-3 text-sm text-warn">{errorMessage}</p> : null}
      <form action={action} className="mt-4">
        <input type="hidden" name="application_id" value={applicationId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-line bg-bg px-4 py-2 text-sm disabled:opacity-60"
        >
          {pending ? "Drafting…" : "Draft answers from profile"}
        </button>
      </form>
      {state.note ? <p className="mt-3 text-sm text-good">{state.note}</p> : null}
      {state.error ? <p className="mt-3 text-sm text-warn">{state.error}</p> : null}
      {answers.length > 0 ? (
        <dl className="mt-5 space-y-3 text-sm">
          {answers.map((item) => (
            <div key={item.id}>
              <dt className="text-muted">
                {item.question}
                {item.needs_user ? " · needs you" : ""}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap">{item.answer || "—"}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={approveAndQueueApplication}>
          <input type="hidden" name="application_id" value={applicationId} />
          <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white">
            Approve for queue
          </button>
        </form>
        <form action={updateApplicationStatus} className="flex flex-wrap gap-2">
          <input type="hidden" name="application_id" value={applicationId} />
          <select name="status" className="rounded-full border border-line bg-bg px-3 py-2 text-sm">
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
            <option value="offer">Offer</option>
            <option value="unverified">I applied myself</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm">
            Update status
          </button>
        </form>
      </div>
    </section>
  );
}
