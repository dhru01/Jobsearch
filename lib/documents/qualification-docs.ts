import { getDocumentSlot, legacySlotForDocument } from "@/lib/documents/catalog";

export function isQualificationOrCertificateDocument(doc: {
  kind: string;
  slot: string | null;
  description: string | null;
}) {
  const slot = legacySlotForDocument(doc);
  if (slot === "cv" || slot === "cover_letter") return false;
  if (slot === "passport" || slot === "work_permit") return false;
  if (slot === "id_card_front" || slot === "id_card_back") return false;

  if (slot === "other_qualification" || slot === "professional_certification") return true;
  if (slot.startsWith("legacy_")) return true;

  const def = getDocumentSlot(slot);
  if (def?.section === "qualification") return true;

  return (
    doc.kind === "qualification" ||
    doc.kind === "certificate" ||
    doc.kind === "transcript" ||
    doc.kind === "professional_certificate"
  );
}
