import type { EducationItem } from "@/lib/profile";
import { normalizeLevel, type QualificationLevel } from "@/lib/matching/score";
import { legacySlotForDocument, slotLabel, type DocumentSlotDef } from "@/lib/documents/catalog";

export type ProfileDocumentRef = {
  id: string;
  kind: string;
  slot: string | null;
  file_name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

export type DocumentRequirement = {
  id: string;
  label: string;
  mandatory: boolean;
  status: "available" | "in_progress" | "missing";
  slot?: string;
};

const LEVEL_TO_CERT_SLOT: Record<QualificationLevel, string> = {
  matric: "matric_certificate",
  certificate: "higher_cert_certificate",
  diploma: "diploma_certificate",
  bachelors: "bachelors_certificate",
  honours: "honours_certificate",
  masters: "masters_certificate",
  doctorate: "doctorate_certificate",
};

const LEVEL_TO_TRANSCRIPT_SLOT: Record<QualificationLevel, string> = {
  matric: "matric_results",
  certificate: "higher_cert_transcript",
  diploma: "diploma_transcript",
  bachelors: "bachelors_transcript",
  honours: "honours_transcript",
  masters: "masters_transcript",
  doctorate: "doctorate_transcript",
};

function docInSlot(documents: ProfileDocumentRef[], slot: string) {
  return documents.filter((doc) => legacySlotForDocument(doc) === slot);
}

function slotSatisfied(documents: ProfileDocumentRef[], slot: string) {
  const rows = docInSlot(documents, slot);
  if (rows.length > 0) return true;
  return documents.some(
    (doc) =>
      legacySlotForDocument(doc) === slot &&
      Boolean((doc.metadata as { in_progress?: boolean } | null)?.in_progress),
  );
}

function inProgressForSlot(
  documents: ProfileDocumentRef[],
  slot: string,
  slotProgress?: Record<string, { in_progress?: boolean }>,
) {
  if (slotProgress?.[slot]?.in_progress && docInSlot(documents, slot).length === 0) return true;
  return documents.some(
    (doc) =>
      legacySlotForDocument(doc) === slot &&
      Boolean((doc.metadata as { in_progress?: boolean } | null)?.in_progress) &&
      docInSlot(documents, slot).length === 0,
  );
}

export function userHasCv(documents: ProfileDocumentRef[]) {
  return documents.some((doc) => doc.kind === "cv" || legacySlotForDocument(doc) === "cv");
}

export function slotProgressFlags(
  extended: Record<string, unknown> | null | undefined,
): Record<string, { in_progress?: boolean }> {
  const progress = extended?.document_slot_progress;
  if (progress && typeof progress === "object" && !Array.isArray(progress)) {
    return progress as Record<string, { in_progress?: boolean }>;
  }
  return {};
}

export function jobDocumentRequirements(
  job: { min_qualification: string | null; title: string },
  documents: ProfileDocumentRef[],
  options?: { requireCv?: boolean; slotProgress?: Record<string, { in_progress?: boolean }> },
): DocumentRequirement[] {
  const requireCv = options?.requireCv ?? true;
  const reqs: DocumentRequirement[] = [];

  if (requireCv) {
    const has = userHasCv(documents);
    reqs.push({
      id: "cv",
      label: "CV / resume",
      mandatory: true,
      status: has ? "available" : "missing",
      slot: "cv",
    });
  }

  const progress = options?.slotProgress;
  const level = normalizeLevel(job.min_qualification);
  if (level) {
    const certSlot = LEVEL_TO_CERT_SLOT[level];
    const transcriptSlot = LEVEL_TO_TRANSCRIPT_SLOT[level];
    reqs.push({
      id: certSlot,
      label: slotLabel(certSlot),
      mandatory: true,
      status: slotSatisfied(documents, certSlot)
        ? "available"
        : inProgressForSlot(documents, certSlot, progress)
          ? "in_progress"
          : "missing",
      slot: certSlot,
    });
    reqs.push({
      id: transcriptSlot,
      label: slotLabel(transcriptSlot),
      mandatory: false,
      status: slotSatisfied(documents, transcriptSlot)
        ? "available"
        : inProgressForSlot(documents, transcriptSlot, progress)
          ? "in_progress"
          : "missing",
      slot: transcriptSlot,
    });
  }

  return reqs;
}

export function requirementsBlockApply(requirements: DocumentRequirement[]) {
  return requirements.some((item) => item.mandatory && item.status === "missing");
}

/** Suggest education rows that match a qualification accordion group. */
export function educationForQualificationGroup(
  education: EducationItem[],
  levels: string[] | undefined,
): EducationItem[] {
  if (!levels?.length) return [];
  const normalizedLevels = new Set(levels.map((l) => l.toLowerCase()));
  return education.filter((row) => {
    const level = (row.level ?? "").toLowerCase().replace(/\s+/g, "_");
    return normalizedLevels.has(level) || (level && normalizedLevels.has(level.split("_")[0]));
  });
}

export function metadataRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function documentDisplayName(doc: ProfileDocumentRef, slotDef: DocumentSlotDef | null) {
  const meta = metadataRecord(doc.metadata);
  const custom = typeof meta.display_name === "string" ? meta.display_name.trim() : "";
  if (custom) return custom;
  if (doc.description?.trim()) return doc.description.trim();
  if (slotDef?.slot === "professional_certification") {
    const cert = typeof meta.certification_name === "string" ? meta.certification_name.trim() : "";
    if (cert) return cert;
  }
  return doc.file_name;
}
