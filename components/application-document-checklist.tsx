import {
  jobDocumentRequirements,
  metadataRecord,
  slotProgressFlags,
  type ProfileDocumentRef,
} from "@/lib/documents/requirements";
import { legacySlotForDocument } from "@/lib/documents/catalog";

export function ApplicationDocumentChecklist({
  jobTitle,
  minQualification,
  documents,
  profileExtended,
  requireCv = true,
}: {
  jobTitle: string;
  minQualification: string | null;
  documents: ProfileDocumentRef[];
  profileExtended?: Record<string, unknown> | null;
  requireCv?: boolean;
}) {
  const normalized: ProfileDocumentRef[] = documents.map((doc) => ({
    ...doc,
    slot: doc.slot ?? legacySlotForDocument({ kind: doc.kind, slot: doc.slot, description: doc.description }),
    metadata: metadataRecord(doc.metadata),
  }));

  const requirements = jobDocumentRequirements(
    { title: jobTitle, min_qualification: minQualification },
    normalized,
    { requireCv, slotProgress: slotProgressFlags(profileExtended ?? {}) },
  );

  if (requirements.length === 0) return null;

  return (
    <section className="rounded-2xl border border-line bg-panel px-4 py-4 text-sm">
      <h3 className="font-medium text-ink">Documents for this role</h3>
      <p className="mt-1 text-muted">
        Based on your profile and this listing. Identity documents are never attached without your explicit approval.
      </p>
      <ul className="mt-3 space-y-2">
        {requirements.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {item.label}
              {item.mandatory ? "" : " (optional)"}
            </span>
            <span
              className={
                item.status === "available"
                  ? "text-good"
                  : item.status === "in_progress"
                    ? "text-muted"
                    : "text-warn"
              }
            >
              {item.status === "available"
                ? "Available"
                : item.status === "in_progress"
                  ? "In progress"
                  : "Missing"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
