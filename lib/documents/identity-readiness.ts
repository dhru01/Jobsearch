import { legacySlotForDocument } from "@/lib/documents/catalog";
import {
  PASSPORT_SLOT,
  resolveIdentityDocumentType,
  SA_ID_CARD_SLOTS,
  type IdentityDocumentType,
} from "@/lib/documents/identity-choice";

type IdentityDoc = {
  kind: string;
  slot: string | null;
  description?: string | null;
};

function slotFor(doc: IdentityDoc) {
  return legacySlotForDocument({
    kind: doc.kind,
    slot: doc.slot,
    description: doc.description ?? null,
  });
}

function hasSlot(documents: IdentityDoc[], slot: string) {
  return documents.some((doc) => slotFor(doc) === slot);
}

export function identityDocumentsReadiness(
  documents: IdentityDoc[],
  storedType: "" | IdentityDocumentType | null | undefined,
): { complete: boolean; missing: string[] } {
  const type = resolveIdentityDocumentType(storedType ?? "", documents, (doc) =>
    legacySlotForDocument({ kind: doc.kind, slot: doc.slot, description: doc.description ?? null }),
  );

  if (!type) {
    return {
      complete: false,
      missing: ["Choose SA ID card or passport and upload the required documents"],
    };
  }

  if (type === "passport") {
    if (hasSlot(documents, PASSPORT_SLOT)) {
      return { complete: true, missing: [] };
    }
    return { complete: false, missing: ["Upload your passport"] };
  }

  const missing: string[] = [];
  if (!hasSlot(documents, "id_card_front")) missing.push("SA ID card (front)");
  if (!hasSlot(documents, "id_card_back")) missing.push("SA ID card (back)");
  return missing.length === 0 ? { complete: true, missing: [] } : { complete: false, missing };
}
