"use client";

import { useMemo, useState } from "react";
import { getDocumentSlot } from "@/lib/documents/catalog";
import { isQualificationOrCertificateDocument } from "@/lib/documents/qualification-docs";
import type { ProfileDocument } from "@/components/profile/documents-panel";
import { DocumentUploadSlot } from "@/components/profile/document-upload-slot";
import { UploadedFileList } from "@/components/profile/uploaded-file-list";

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg text-ink">{title}</h3>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function QualificationsCertificatesSection({
  documents,
  replaceTarget,
  setReplaceTarget,
}: {
  documents: ProfileDocument[];
  replaceTarget: string | null;
  setReplaceTarget: (id: string | null) => void;
}) {
  const uploadDef = getDocumentSlot("other_qualification");
  const qualificationDocs = useMemo(
    () => documents.filter((doc) => isQualificationOrCertificateDocument(doc)),
    [documents],
  );
  const [draftRowIds, setDraftRowIds] = useState(() => [crypto.randomUUID()]);

  if (!uploadDef) return null;

  const replacing =
    replaceTarget && qualificationDocs.some((doc) => doc.id === replaceTarget) ? replaceTarget : null;

  function addRow() {
    setDraftRowIds((current) => [...current, crypto.randomUUID()]);
  }

  function removeRow(id: string) {
    setDraftRowIds((current) => (current.length > 1 ? current.filter((rowId) => rowId !== id) : current));
  }

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-line bg-raised p-5">
      <SectionHeading
        title="Qualifications and Certificates"
        description="Name each qualification or certificate, then upload the document. Add as many as you need — all optional."
      />

      {qualificationDocs.length > 0 && !replacing ? (
        <UploadedFileList
          files={qualificationDocs}
          def={uploadDef}
          onReplace={setReplaceTarget}
          compact={false}
        />
      ) : null}

      {replacing ? (
        <DocumentUploadSlot
          def={uploadDef}
          uploaded={qualificationDocs.filter((doc) => doc.id !== replacing)}
          replaceId={replacing}
          onCancelReplace={() => setReplaceTarget(null)}
          onReplaceRequest={setReplaceTarget}
          extraFields="other_qual"
          hideHeader
          requireQualificationLabel
        />
      ) : (
        <div className="space-y-3">
          {draftRowIds.map((rowId, index) => (
            <div key={rowId} className="relative">
              {index > 0 ? (
                <button
                  type="button"
                  className="absolute right-5 top-5 z-10 text-sm text-muted underline hover:text-ink"
                  onClick={() => removeRow(rowId)}
                >
                  Remove
                </button>
              ) : null}
              <DocumentUploadSlot
                def={uploadDef}
                uploaded={[]}
                extraFields="other_qual"
                hideHeader
                requireQualificationLabel
                onUploaded={() => removeRow(rowId)}
              />
            </div>
          ))}
        </div>
      )}

      {!replacing ? (
        <button type="button" className="text-sm text-accent" onClick={addRow}>
          Add qualification or certificate
        </button>
      ) : null}
    </section>
  );
}
