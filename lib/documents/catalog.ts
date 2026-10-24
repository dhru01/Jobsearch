export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const CV_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const IMAGE_PDF_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export type DocumentSectionId = "cv" | "identity" | "qualification";

export type QualificationGroupId =
  | "matric"
  | "higher_certificate"
  | "diploma"
  | "bachelors"
  | "honours"
  | "masters"
  | "doctorate"
  | "professional"
  | "other";

export type DocumentSlotDef = {
  slot: string;
  label: string;
  section: DocumentSectionId;
  qualificationGroup?: QualificationGroupId;
  accept: readonly string[];
  acceptHint: string;
  /** Multiple files allowed in this slot (e.g. several CVs). */
  multiple: boolean;
  /** Required to complete the profile Documents tab (CV only). */
  profileRequired?: boolean;
  kind: "cv" | "cover_letter" | "identity" | "qualification" | "portfolio" | "other";
  educationLevels?: string[];
  allowInProgress?: boolean;
};

export const DOCUMENT_SLOTS: DocumentSlotDef[] = [
  {
    slot: "cv",
    label: "CV / resume",
    section: "cv",
    accept: CV_MIME,
    acceptHint: "PDF, DOC, or DOCX · max 10 MB",
    multiple: true,
    kind: "cv",
    profileRequired: true,
  },
  {
    slot: "cover_letter",
    label: "Cover letter (optional)",
    section: "cv",
    accept: CV_MIME,
    acceptHint: "PDF, DOC, or DOCX · max 10 MB",
    multiple: true,
    kind: "cover_letter",
  },
  {
    slot: "id_card_front",
    label: "South African ID card (front)",
    section: "identity",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: false,
    kind: "identity",
  },
  {
    slot: "id_card_back",
    label: "South African ID card (back)",
    section: "identity",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: false,
    kind: "identity",
  },
  {
    slot: "passport",
    label: "Passport",
    section: "identity",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: false,
    kind: "identity",
  },
  {
    slot: "work_permit",
    label: "Work permit / visa",
    section: "identity",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: false,
    kind: "identity",
  },
  {
    slot: "matric_certificate",
    label: "Matric certificate",
    section: "qualification",
    qualificationGroup: "matric",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["matric", "grade_12", "nsc"],
    allowInProgress: true,
  },
  {
    slot: "matric_results",
    label: "Matric results / statement of results",
    section: "qualification",
    qualificationGroup: "matric",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["matric", "grade_12", "nsc"],
    allowInProgress: true,
  },
  {
    slot: "higher_cert_certificate",
    label: "Higher certificate",
    section: "qualification",
    qualificationGroup: "higher_certificate",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["certificate", "higher_certificate"],
    allowInProgress: true,
  },
  {
    slot: "higher_cert_transcript",
    label: "Academic transcript",
    section: "qualification",
    qualificationGroup: "higher_certificate",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["certificate", "higher_certificate"],
    allowInProgress: true,
  },
  {
    slot: "diploma_certificate",
    label: "Diploma certificate",
    section: "qualification",
    qualificationGroup: "diploma",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["diploma", "national_diploma", "advanced_diploma"],
    allowInProgress: true,
  },
  {
    slot: "diploma_transcript",
    label: "Academic transcript",
    section: "qualification",
    qualificationGroup: "diploma",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["diploma", "national_diploma", "advanced_diploma"],
    allowInProgress: true,
  },
  {
    slot: "bachelors_certificate",
    label: "Degree certificate",
    section: "qualification",
    qualificationGroup: "bachelors",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["bachelors", "degree", "undergraduate"],
    allowInProgress: true,
  },
  {
    slot: "bachelors_transcript",
    label: "Academic transcript",
    section: "qualification",
    qualificationGroup: "bachelors",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["bachelors", "degree", "undergraduate"],
    allowInProgress: true,
  },
  {
    slot: "honours_certificate",
    label: "Qualification certificate",
    section: "qualification",
    qualificationGroup: "honours",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["honours", "postgraduate_diploma"],
    allowInProgress: true,
  },
  {
    slot: "honours_transcript",
    label: "Academic transcript",
    section: "qualification",
    qualificationGroup: "honours",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["honours", "postgraduate_diploma"],
    allowInProgress: true,
  },
  {
    slot: "masters_certificate",
    label: "Master's certificate",
    section: "qualification",
    qualificationGroup: "masters",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["masters", "mba", "msc"],
    allowInProgress: true,
  },
  {
    slot: "masters_transcript",
    label: "Academic transcript",
    section: "qualification",
    qualificationGroup: "masters",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["masters", "mba", "msc"],
    allowInProgress: true,
  },
  {
    slot: "doctorate_certificate",
    label: "Doctoral certificate",
    section: "qualification",
    qualificationGroup: "doctorate",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["doctorate", "phd"],
    allowInProgress: true,
  },
  {
    slot: "doctorate_transcript",
    label: "Academic transcript",
    section: "qualification",
    qualificationGroup: "doctorate",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    educationLevels: ["doctorate", "phd"],
    allowInProgress: true,
  },
  {
    slot: "professional_certification",
    label: "Professional certificate",
    section: "qualification",
    qualificationGroup: "professional",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    allowInProgress: false,
  },
  {
    slot: "other_qualification",
    label: "Supporting document",
    section: "qualification",
    qualificationGroup: "other",
    accept: IMAGE_PDF_MIME,
    acceptHint: "PDF, JPG, JPEG, or PNG · max 10 MB",
    multiple: true,
    kind: "qualification",
    allowInProgress: true,
  },
];

export const QUALIFICATION_GROUP_LABELS: Record<QualificationGroupId, string> = {
  matric: "Matric / National Senior Certificate",
  higher_certificate: "Higher certificate",
  diploma: "Diploma / Advanced diploma",
  bachelors: "Bachelor's degree",
  honours: "Honours / Postgraduate diploma",
  masters: "Master's degree",
  doctorate: "Doctorate / PhD",
  professional: "Professional certifications",
  other: "Other qualifications",
};

const SLOT_BY_ID = new Map(DOCUMENT_SLOTS.map((item) => [item.slot, item]));

export function getDocumentSlot(slot: string | null | undefined): DocumentSlotDef | null {
  if (!slot) return null;
  return SLOT_BY_ID.get(slot) ?? null;
}

/** Map legacy `kind` rows (pre-slot) into the new UI. */
export function legacySlotForDocument(doc: {
  kind: string;
  slot: string | null;
  description: string | null;
}): string {
  if (doc.slot) return doc.slot;
  switch (doc.kind) {
    case "cv":
      return "cv";
    case "cover_letter":
      return "cover_letter";
    case "transcript":
      return "legacy_transcript";
    case "certificate":
      return "legacy_certificate";
    case "professional_certificate":
      return "professional_certification";
    case "portfolio":
      return "legacy_portfolio";
    case "other":
      return "other_qualification";
    default:
      return doc.kind;
  }
}

export function slotLabel(slot: string): string {
  const def = getDocumentSlot(slot);
  if (def) return def.label;
  if (slot === "legacy_transcript") return "Academic transcript (uploaded earlier)";
  if (slot === "legacy_certificate") return "Qualification certificate (uploaded earlier)";
  if (slot === "legacy_portfolio") return "Portfolio";
  return slot.replace(/_/g, " ");
}

export function extensionAllowed(fileName: string, mimeType: string, accept: readonly string[]): boolean {
  const lower = fileName.toLowerCase();
  const extOk =
    (accept.includes("application/pdf") && lower.endsWith(".pdf")) ||
    (accept.includes("application/msword") && lower.endsWith(".doc")) ||
    (accept.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") &&
      lower.endsWith(".docx")) ||
    (accept.some((m) => m.startsWith("image/")) &&
      (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")));
  if (extOk) return true;
  if (mimeType && accept.includes(mimeType as (typeof accept)[number])) return true;
  return false;
}
