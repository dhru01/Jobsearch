"use client";

import { useActionState } from "react";
import { uploadCv, type UploadState } from "@/lib/actions/cv";
import { Alert, Notice } from "@/components/field";

const initial: UploadState = { error: null, ok: false, note: null };

export function UploadForm() {
  const [state, action, pending] = useActionState(uploadCv, initial);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] border border-line bg-raised p-5">
      <div>
        <h2 className="text-base font-medium">Upload your CV</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          PDF or DOCX, up to 10 MB. Extracted details stay a draft until you confirm them.
        </p>
      </div>
      <input
        name="cv"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        required
        className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
      />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok && state.note ? <Notice>{state.note}</Notice> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-2 disabled:opacity-60"
      >
        {pending ? "Reading CV…" : "Upload and extract"}
      </button>
    </form>
  );
}
