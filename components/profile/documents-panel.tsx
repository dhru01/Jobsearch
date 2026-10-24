"use client";

import { useMemo, useState, useTransition } from "react";
import type { EducationItem } from "@/lib/profile";
import { DOCUMENT_SLOTS, legacySlotForDocument, type DocumentSlotDef } from "@/lib/documents/catalog";
import { QualificationsCertificatesSection } from "@/components/profile/qualifications-certificates-section";
import { educationForQualificationGroup } from "@/lib/documents/requirements";
import { setSlotInProgress } from "@/lib/actions/documents";
import {
  PASSPORT_SLOT,
  resolveIdentityDocumentType,
  SA_ID_CARD_SLOTS,
  type IdentityDocumentType,
} from "@/lib/documents/identity-choice";
import { DocumentUploadSlot } from "@/components/profile/document-upload-slot";

export type ProfileDocument = {
  id: string;
  kind: string;
  slot: string | null;
  file_name: string;
  mime_type: string | null;
  byte_size: number | null;
  created_at: string;
  description: string | null;
  is_default: boolean | null;
  metadata: Record<string, unknown> | null;
  status?: string | null;
};

function docsInSlot(documents: ProfileDocument[], slot: string) {
  return documents.filter((doc) => legacySlotForDocument(doc) === slot);
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg text-ink">{title}</h3>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function SlotBlock({
  def,
  documents,
  replaceTarget,
  setReplaceTarget,
  slotProgress,
  education,
  disabled = false,
  disabledReason,
}: {
  def: DocumentSlotDef;
  documents: ProfileDocument[];
  replaceTarget: string | null;
  setReplaceTarget: (id: string | null) => void;
  slotProgress: Record<string, { in_progress?: boolean }>;
  education: EducationItem[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [, startTransition] = useTransition();
  const rows = docsInSlot(documents, def.slot);
  const replacing = replaceTarget && rows.some((row) => row.id === replaceTarget) ? replaceTarget : null;
  const inProgress = Boolean(slotProgress[def.slot]?.in_progress);
  const linkedEducation = educationForQualificationGroup(education, def.educationLevels);
  const educationKey = linkedEducation[0]
    ? `${linkedEducation[0].institution}|${linkedEducation[0].qualification}`
    : undefined;

  const extraFields =
    def.qualificationGroup === "professional"
      ? "professional"
      : def.qualificationGroup === "other"
        ? "other_qual"
        : undefined;

  const uploaded = replacing ? rows.filter((doc) => doc.id !== replacing) : rows;

  return (
    <div className="space-y-3">
      <DocumentUploadSlot
        def={def}
        uploaded={uploaded}
        replaceId={replacing}
        onCancelReplace={() => setReplaceTarget(null)}
        onReplaceRequest={setReplaceTarget}
        extraFields={extraFields}
        educationKey={educationKey}
        disabled={disabled}
        disabledReason={disabledReason}
      />

      {def.allowInProgress ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="accent-accent"
            checked={inProgress}
            onChange={(e) => {
              startTransition(() => {
                void setSlotInProgress(def.slot, e.target.checked);
              });
            }}
          />
          Qualification still in progress (certificate not required yet)
        </label>
      ) : null}

      {linkedEducation.length > 0 ? (
        <p className="text-xs text-muted">
          Linked education:{" "}
          {linkedEducation.map((row) => `${row.qualification || "Qualification"} @ ${row.institution || "Institution"}`).join("; ")}
        </p>
      ) : null}

    </div>
  );
}

export function DocumentsPanel({
  documents,
  education,
  slotProgress = {},
  identityDocumentTypeStored = "",
  onIdentityDocumentTypeChange,
}: {
  documents: ProfileDocument[];
  education?: EducationItem[];
  slotProgress?: Record<string, { in_progress?: boolean }>;
  identityDocumentTypeStored?: "" | IdentityDocumentType;
  onIdentityDocumentTypeChange?: (type: IdentityDocumentType) => void;
}) {
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const educationRows = education ?? [];

  const cvSlots = useMemo(() => DOCUMENT_SLOTS.filter((item) => item.section === "cv"), []);
  const identitySlots = useMemo(() => DOCUMENT_SLOTS.filter((item) => item.section === "identity"), []);
  const identityChoice = useMemo(() => {
    if (identityDocumentTypeStored === "sa_id_card" || identityDocumentTypeStored === "passport") {
      return identityDocumentTypeStored;
    }
    return resolveIdentityDocumentType("", documents, (doc) =>
      legacySlotForDocument({ kind: doc.kind, slot: doc.slot, description: null }),
    );
  }, [identityDocumentTypeStored, documents]);
  const [identityChoiceError, setIdentityChoiceError] = useState<string | null>(null);

  function chooseIdentity(type: IdentityDocumentType) {
    setIdentityChoiceError(null);
    const hasSaId = documents.some((doc) =>
      SA_ID_CARD_SLOTS.includes(
        legacySlotForDocument(doc) as (typeof SA_ID_CARD_SLOTS)[number],
      ),
    );
    const hasPassport = documents.some((doc) => legacySlotForDocument(doc) === PASSPORT_SLOT);
    if (type === "passport" && hasSaId) {
      setIdentityChoiceError("Delete your SA ID card uploads before switching to passport.");
      return;
    }
    if (type === "sa_id_card" && hasPassport) {
      setIdentityChoiceError("Delete your passport before switching to SA ID card.");
      return;
    }
    onIdentityDocumentTypeChange?.(type);
  }

  const passportBlocked = identityChoice === "sa_id_card";
  const saIdBlocked = identityChoice === "passport";
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        Files stay in private storage and are only shared when you approve an application. Identity documents and cover
        letters are optional unless an employer asks for them.
      </p>

      <section className="space-y-4 rounded-[1.5rem] border border-line bg-raised p-5">
        <SectionHeading
          title="CV / Resume (required)"
          description="Upload at least one CV to complete your profile. You can add more and choose a default for applications."
        />
        {cvSlots.map((def) => (
          <SlotBlock
            key={def.slot}
            def={def}
            documents={documents}
            replaceTarget={replaceTarget}
            setReplaceTarget={setReplaceTarget}
            slotProgress={slotProgress}
            education={educationRows}
          />
        ))}
      </section>

      <section className="space-y-4 rounded-[1.5rem] border border-line bg-raised p-5">
        <SectionHeading
          title="Identity documents"
          description="Required. Choose SA ID card or passport — not both. Upload front and back for SA ID, or your passport. Work permit / visa is only if you choose passport."
        />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">
            I will upload <span className="text-accent">*</span>
          </legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="identity_document_type"
                className="accent-accent"
                checked={identityChoice === "sa_id_card"}
                onChange={() => chooseIdentity("sa_id_card")}
              />
              SA ID card
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="identity_document_type"
                className="accent-accent"
                checked={identityChoice === "passport"}
                onChange={() => chooseIdentity("passport")}
              />
              Passport
            </label>
          </div>
        </fieldset>
        {identityChoiceError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {identityChoiceError}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {(["id_card_front", "id_card_back", PASSPORT_SLOT, "work_permit"] as const).map((slotId) => {
            const def = identitySlots.find((item) => item.slot === slotId);
            if (!def) return null;
            const isPassport = def.slot === PASSPORT_SLOT;
            const isSaId = SA_ID_CARD_SLOTS.includes(def.slot as (typeof SA_ID_CARD_SLOTS)[number]);
            const isWorkPermit = def.slot === "work_permit";
            const blockedByChoice = (isPassport && passportBlocked) || (isSaId && saIdBlocked);
            const needsChoice = (isSaId || isPassport) && !identityChoice;
            const disabled =
              blockedByChoice || needsChoice || (isWorkPermit && passportBlocked);
            return (
              <SlotBlock
                key={def.slot}
                def={def}
                documents={documents}
                replaceTarget={replaceTarget}
                setReplaceTarget={setReplaceTarget}
                slotProgress={slotProgress}
                education={educationRows}
                disabled={disabled}
                disabledReason={
                  isWorkPermit && passportBlocked
                    ? "Work permit / visa is not used with SA ID card. Choose passport above if you need to upload a visa."
                    : needsChoice
                      ? "Select SA ID card or passport above before uploading."
                      : isPassport
                        ? "You selected SA ID card. Choose passport above to upload a passport instead."
                        : "You selected passport. Choose SA ID card above to upload ID card images instead."
                }
              />
            );
          })}
        </div>
      </section>

      <QualificationsCertificatesSection
        documents={documents}
        replaceTarget={replaceTarget}
        setReplaceTarget={setReplaceTarget}
      />
    </div>
  );
}
