"use client";

import { useActionState } from "react";
import { uploadSupportingDocument, type DocumentUploadState } from "@/lib/actions/documents";
import { Alert, fieldClass, FieldLabel } from "@/components/field";

const initial: DocumentUploadState = { error: null, ok: false };

export function DocumentUploadForm() {
  const [state, action, pending] = useActionState(uploadSupportingDocument, initial);

  return (
    <form action={action} className="space-y-3 rounded-[1.5rem] border border-line bg-raised p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="kind">Type</FieldLabel>
          <select id="kind" name="kind" className={fieldClass} defaultValue="cv">
            <option value="cv">CV / resume</option>
            <option value="cover_letter">Cover letter</option>
            <option value="transcript">Academic transcript</option>
            <option value="certificate">Qualification certificate</option>
            <option value="professional_certificate">Professional certificate</option>
            <option value="portfolio">Portfolio</option>
            <option value="other">Supporting document</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="file">File</FieldLabel>
          <input id="file" name="file" type="file" required className="mt-1.5 block w-full text-sm" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
          <input id="description" name="description" className={fieldClass} placeholder="e.g. General CV, 2026" />
        </div>
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <p className="text-sm text-good">Uploaded.</p> : null}
      <button type="submit" disabled={pending} className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
