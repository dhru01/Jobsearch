"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  replaceProfileDocument,
  uploadProfileDocument,
  type DocumentUploadState,
} from "@/lib/actions/documents";
import type { DocumentSlotDef } from "@/lib/documents/catalog";
import type { ProfileDocument } from "@/components/profile/documents-panel";
import { UploadedFileList } from "@/components/profile/uploaded-file-list";
import { Alert, fieldClass, FieldLabel } from "@/components/field";

const initial: DocumentUploadState = { error: null, ok: false };

function acceptAttr(def: DocumentSlotDef) {
  const parts: string[] = [];
  if (def.accept.includes("application/pdf")) parts.push(".pdf");
  if (def.accept.includes("application/msword")) parts.push(".doc");
  if (
    def.accept.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  ) {
    parts.push(".docx");
  }
  if (def.accept.some((m) => m.startsWith("image/"))) parts.push(".jpg,.jpeg,.png");
  return parts.join(",");
}

export function DocumentUploadSlot({
  def,
  uploaded = [],
  replaceId,
  onCancelReplace,
  onReplaceRequest,
  extraFields,
  educationKey,
  disabled = false,
  disabledReason,
  hideHeader = false,
  requireQualificationLabel = false,
  onUploaded,
}: {
  def: DocumentSlotDef;
  uploaded?: ProfileDocument[];
  replaceId?: string | null;
  onCancelReplace?: () => void;
  onReplaceRequest?: (id: string) => void;
  extraFields?: "professional" | "other_qual";
  educationKey?: string;
  disabled?: boolean;
  disabledReason?: string;
  hideHeader?: boolean;
  requireQualificationLabel?: boolean;
  onUploaded?: () => void;
}) {
  const router = useRouter();
  const action = replaceId ? replaceProfileDocument : uploadProfileDocument;
  const [state, formAction, pending] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<string | null>(null);

  function onFileChosen() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setPicked(file.name);
    formRef.current?.requestSubmit();
  }

  const showUploadForm =
    !disabled && (replaceId != null || def.multiple || uploaded.length === 0);

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    formRef.current?.reset();
    setPicked(null);
    if (replaceId && onCancelReplace) onCancelReplace();
    onUploaded?.();
  }, [state.ok, router, replaceId, onCancelReplace, onUploaded]);

  return (
    <div
      className={`space-y-3 rounded-xl border border-line bg-bg/40 p-4 ${disabled ? "opacity-60" : ""}`}
    >
      {hideHeader ? null : (
        <>
          <p className="text-sm font-medium text-ink">
            {def.label}
            {def.profileRequired ? <span className="text-accent"> *</span> : null}
          </p>
          <p className="text-xs text-muted">{def.acceptHint}</p>
        </>
      )}

      {disabled && disabledReason ? <p className="text-xs text-muted">{disabledReason}</p> : null}

      {showUploadForm ? (
        <form ref={formRef} action={formAction} className="space-y-3 border-t border-line/60 pt-3">
          <input type="hidden" name="slot" value={def.slot} />
          {replaceId ? <input type="hidden" name="replace_id" value={replaceId} /> : null}
          {educationKey ? <input type="hidden" name="education_key" value={educationKey} /> : null}

          {extraFields === "professional" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${def.slot}-cert`}>Certification name</FieldLabel>
                <input id={`${def.slot}-cert`} name="certification_name" className={fieldClass} placeholder="e.g. CA(SA)" />
              </div>
              <div>
                <FieldLabel htmlFor={`${def.slot}-issuer`}>Issuing institution</FieldLabel>
                <input id={`${def.slot}-issuer`} name="issuing_institution" className={fieldClass} placeholder="e.g. SAICA" />
              </div>
            </div>
          ) : null}

          {extraFields === "other_qual" ? (
            <div>
              <FieldLabel htmlFor={`${def.slot}-qual`}>
                Qualification or certificate name{requireQualificationLabel ? <span className="text-accent"> *</span> : null}
              </FieldLabel>
              <input
                id={`${def.slot}-qual`}
                name="qualification_label"
                className={fieldClass}
                placeholder="e.g. BCom Economics, CA(SA), Matric certificate"
                required={requireQualificationLabel}
              />
              {hideHeader ? <p className="mt-1 text-xs text-muted">{def.acceptHint}</p> : null}
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            id={`${def.slot}-file`}
            name="file"
            type="file"
            accept={acceptAttr(def)}
            className="sr-only"
            onChange={onFileChosen}
          />
          {picked && pending ? (
            <p className="text-xs text-muted">Uploading {picked}…</p>
          ) : picked ? (
            <p className="text-xs text-muted">Selected: {picked}</p>
          ) : null}

          {state.error ? <Alert>{state.error}</Alert> : null}
          {state.ok ? (
            <p className="text-sm text-good">{replaceId ? "File replaced." : "Uploaded."}</p>
          ) : null}

          {!replaceId && uploaded.length > 0 ? (
            <UploadedFileList files={uploaded} def={def} onReplace={onReplaceRequest} />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || disabled}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
            >
              {pending ? "Uploading…" : replaceId ? "Choose file to replace" : "Upload"}
            </button>
            {replaceId && onCancelReplace ? (
              <button type="button" className="text-sm text-muted underline" onClick={onCancelReplace}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="space-y-3 border-t border-line/60 pt-3">
          <UploadedFileList files={uploaded} def={def} onReplace={onReplaceRequest} />
          <p className="text-xs text-muted">Use Replace on a file to upload a new version.</p>
        </div>
      )}
    </div>
  );
}
