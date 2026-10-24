export type IdentityDocumentType = "sa_id_card" | "passport";

export const SA_ID_CARD_SLOTS = ["id_card_front", "id_card_back"] as const;
export const PASSPORT_SLOT = "passport";

export function identityTypeFromSlot(slot: string): IdentityDocumentType | null {
  if (SA_ID_CARD_SLOTS.includes(slot as (typeof SA_ID_CARD_SLOTS)[number])) return "sa_id_card";
  if (slot === PASSPORT_SLOT) return "passport";
  return null;
}

export function resolveIdentityDocumentType(
  stored: string | undefined | null,
  documents: { slot: string | null; kind: string }[],
  legacySlot: (doc: { kind: string; slot: string | null; description: string | null }) => string,
): IdentityDocumentType | null {
  if (stored === "sa_id_card" || stored === "passport") return stored;

  const slots = documents.map((doc) =>
    legacySlot({ kind: doc.kind, slot: doc.slot, description: null }),
  );
  if (slots.some((slot) => slot === PASSPORT_SLOT)) return "passport";
  if (slots.some((slot) => SA_ID_CARD_SLOTS.includes(slot as (typeof SA_ID_CARD_SLOTS)[number]))) {
    return "sa_id_card";
  }
  return null;
}
