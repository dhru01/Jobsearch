"use client";

import { useActionState } from "react";
import {
  generateTailoredDocuments,
  saveTailoredDocumentReview,
  type TailorActionState,
} from "@/lib/actions/tailored-documents";
import type { TailoredDocumentMeta } from "@/lib/documents/tailored-types";

const initial: TailorActionState = { error: null, ok: false, note: null };

type Props = {
  applicationId: string;
  documentId: string | null;
  meta: TailoredDocumentMeta | null;
  postingUrl: string;
  applicationStatus: string;
};

function Feedback({ state }: { state: TailorActionState }) {
  if (state.error) {
    return <p className="rounded-2xl bg-warn-bg px-4 py-3 text-sm text-warn">{state.error}</p>;
  }
  if (state.note) {
    return <p className="rounded-2xl bg-good-bg px-4 py-3 text-sm text-good">{state.note}</p>;
  }
  return null;
}

export function TailoredDocumentEditor({
  applicationId,
  documentId,
  meta,
  postingUrl,
  applicationStatus,
}: Props) {
  const [generateState, generateAction, generatePending] = useActionState(generateTailoredDocuments, initial);
  const [saveState, saveAction, savePending] = useActionState(saveTailoredDocumentReview, initial);

  if (!meta || !documentId) {
    return (
      <section className="rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
        <h2 className="text-xl">Tailored documents</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Fieldwork builds a CV and cover letter from your confirmed profile only. You review every line before
          downloading. Nothing is submitted to the employer from here.
        </p>
        <form action={generateAction} className="mt-5">
          <input type="hidden" name="application_id" value={applicationId} />
          <button
            type="submit"
            disabled={generatePending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {generatePending ? "Generating…" : "Generate tailored CV & cover letter"}
          </button>
        </form>
        <Feedback state={generateState} />
      </section>
    );
  }

  const cv = meta.cv;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl">Review before you apply</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Edit wording if needed. Do not add employers, degrees, or skills that are not on your confirmed profile.
            </p>
          </div>
          <span className="rounded-full bg-panel px-3 py-1 text-xs text-muted capitalize">{applicationStatus}</span>
        </div>

        <form action={saveAction} className="mt-6 space-y-5">
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="document_id" value={documentId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Full name</span>
              <input
                name="full_name"
                defaultValue={cv.full_name}
                className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Headline</span>
              <input
                name="headline"
                defaultValue={cv.headline}
                className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Email</span>
              <input
                name="email"
                defaultValue={cv.email}
                className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Phone</span>
              <input
                name="phone"
                defaultValue={cv.phone}
                className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Location</span>
              <input
                name="location"
                defaultValue={cv.location}
                className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-muted">Summary</span>
            <textarea
              name="summary"
              rows={4}
              defaultValue={cv.summary}
              className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="text-muted">Skills (comma-separated)</span>
            <input
              name="skills"
              defaultValue={cv.skills.join(", ")}
              className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
            />
          </label>

          {cv.experience.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Experience summaries</p>
              {cv.experience.map((item, index) => (
                <label key={`${item.title}-${index}`} className="block text-sm">
                  <span className="text-muted">
                    {[item.title, item.organisation].filter(Boolean).join(" · ")}
                  </span>
                  <textarea
                    name={`experience_summary_${index}`}
                    rows={3}
                    defaultValue={item.summary}
                    className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2"
                  />
                </label>
              ))}
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="text-muted">Cover letter</span>
            <textarea
              name="cover_letter"
              rows={10}
              defaultValue={meta.cover_letter}
              className="mt-1 w-full rounded-2xl border border-line bg-bg px-3 py-2 font-mono text-[13px]"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={savePending}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {savePending ? "Saving…" : "Save review"}
            </button>
          </div>
        </form>
        <div className="mt-4 space-y-3">
          <Feedback state={saveState} />
          <Feedback state={generateState} />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
        <h3 className="text-lg">Download & apply externally</h3>
        <p className="mt-2 text-sm text-muted">
          Fieldwork does not submit applications. Open the employer posting, upload these PDFs, and confirm submission
          yourself.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/dashboard/applications/${applicationId}/download?kind=cv`}
            className="rounded-full border border-line bg-bg px-4 py-2 text-sm"
          >
            Download CV (PDF)
          </a>
          <a
            href={`/dashboard/applications/${applicationId}/download?kind=cover`}
            className="rounded-full border border-line bg-bg px-4 py-2 text-sm"
          >
            Download cover letter (PDF)
          </a>
          <a
            href={postingUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ink px-4 py-2 text-sm text-bg"
          >
            Open employer posting
          </a>
        </div>
      </section>
    </div>
  );
}
