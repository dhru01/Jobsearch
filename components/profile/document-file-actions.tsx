"use client";

import { useState, useTransition } from "react";
import { deleteDocument, setDefaultCv } from "@/lib/actions/documents";
import { openProfileDocument } from "@/lib/documents/open-client";
import { Alert } from "@/components/field";

export function DocumentFileActions({
  documentId,
  kind,
  slot,
  isDefault,
  onReplace,
}: {
  documentId: string;
  kind: string;
  slot: string;
  isDefault: boolean | null;
  onReplace?: () => void;
}) {
  const [, startTransition] = useTransition();
  const [openError, setOpenError] = useState<string | null>(null);

  function openFile(mode: "preview" | "download") {
    setOpenError(null);
    startTransition(async () => {
      const result = await openProfileDocument(documentId, mode);
      if (result.error) setOpenError(result.error);
    });
  }

  const isCv = kind === "cv" || slot === "cv";

  return (
    <div className="flex w-full flex-col items-end gap-2 sm:w-auto">
      {openError ? <Alert>{openError}</Alert> : null}
      <div className="flex flex-wrap gap-2">
      <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={() => openFile("preview")}>
        Preview
      </button>
      <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={() => openFile("download")}>
        Download
      </button>
      {onReplace ? (
        <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={onReplace}>
          Replace
        </button>
      ) : null}
      {isCv && !isDefault ? (
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1.5 text-sm"
          onClick={() => startTransition(() => { void setDefaultCv(documentId); })}
        >
          Make default
        </button>
      ) : null}
      <button
        type="button"
        className="rounded-full border border-line px-3 py-1.5 text-sm text-warn"
        onClick={() => {
          if (window.confirm("Delete this file? This cannot be undone.")) {
            startTransition(() => { void deleteDocument(documentId); });
          }
        }}
      >
        Delete
      </button>
      </div>
    </div>
  );
}
