"use client";

import { useState, useTransition } from "react";
import type { DocumentSlotDef } from "@/lib/documents/catalog";
import { documentDisplayName } from "@/lib/documents/requirements";
import { documentStatusNote } from "@/lib/documents/status-label";
import { openProfileDocument } from "@/lib/documents/open-client";
import { deleteDocument, setDefaultCv } from "@/lib/actions/documents";
import type { ProfileDocument } from "@/components/profile/documents-panel";
import { Alert } from "@/components/field";

export function UploadedFileList({
  files,
  def,
  onReplace,
  compact = true,
}: {
  files: ProfileDocument[];
  def: DocumentSlotDef;
  onReplace?: (id: string) => void;
  compact?: boolean;
}) {
  const [openError, setOpenError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      {openError ? <Alert>{openError}</Alert> : null}
      <ul className={compact ? "space-y-2" : "space-y-3"}>
        {files.map((doc) => {
          const title = documentDisplayName({ ...doc, metadata: doc.metadata }, def);
          const statusNote = documentStatusNote(doc.status);
          const isCv = doc.kind === "cv" || def.slot === "cv";
          return (
            <li
              key={doc.id}
              className={
                compact
                  ? "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-raised/80 px-3 py-2"
                  : "rounded-2xl border border-line bg-raised px-4 py-3"
              }
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  setOpenError(null);
                  startTransition(async () => {
                    const result = await openProfileDocument(doc.id, "preview");
                    if (result.error) setOpenError(result.error);
                  });
                }}
              >
                <span className="block truncate text-sm font-medium text-accent underline-offset-2 hover:underline">
                  {title}
                </span>
                <span className="block truncate text-xs text-muted">
                  {doc.file_name}
                  {doc.is_default ? " · Default" : ""}
                  {" · "}
                  {new Date(doc.created_at).toLocaleDateString("en-ZA")}
                </span>
                {statusNote ? <span className="mt-0.5 block text-xs text-muted">{statusNote}</span> : null}
              </button>
              <div className="flex shrink-0 flex-wrap gap-1.5 text-xs">
                {isCv && !doc.is_default ? (
                  <button
                    type="button"
                    className="rounded-full border border-line px-2 py-1 text-muted hover:text-ink"
                    onClick={() => startTransition(() => { void setDefaultCv(doc.id); })}
                  >
                    Default
                  </button>
                ) : null}
                {onReplace ? (
                  <button
                    type="button"
                    className="rounded-full border border-line px-2 py-1 text-muted hover:text-ink"
                    onClick={() => onReplace(doc.id)}
                  >
                    Replace
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-full border border-line px-2 py-1 text-warn"
                  onClick={() => {
                    if (window.confirm("Delete this file?")) {
                      startTransition(() => { void deleteDocument(doc.id); });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
