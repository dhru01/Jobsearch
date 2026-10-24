"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { ensureProfileForUser, requireConfirmedProfile } from "@/lib/auth";
import { extensionAllowed, getDocumentSlot, legacySlotForDocument, MAX_DOCUMENT_BYTES } from "@/lib/documents/catalog";
import {
  identityTypeFromSlot,
  PASSPORT_SLOT,
  resolveIdentityDocumentType,
  SA_ID_CARD_SLOTS,
  type IdentityDocumentType,
} from "@/lib/documents/identity-choice";
import { metadataRecord } from "@/lib/documents/requirements";

const LEGACY_KINDS = [
  "cv",
  "cover_letter",
  "transcript",
  "certificate",
  "professional_certificate",
  "portfolio",
  "other",
] as const;

export type DocumentUploadState = { error: string | null; ok: boolean };

function slotFromForm(formData: FormData) {
  const slot = String(formData.get("slot") ?? "").trim();
  const def = getDocumentSlot(slot);
  if (!def) return { error: "Unknown document type.", def: null };
  return { error: null, def };
}

async function findDuplicate(
  supabase: Awaited<ReturnType<typeof requireConfirmedProfile>>["supabase"],
  userId: string,
  slot: string,
  fileName: string,
  byteSize: number,
  contentHash: string,
  excludeId?: string,
) {
  const { data } = await supabase
    .from("documents")
    .select("id, file_name, byte_size, metadata, slot, kind")
    .eq("user_id", userId);

  return (data ?? []).find((row) => {
    if (excludeId && row.id === excludeId) return false;
    const rowSlot = legacySlotForDocument({
      kind: String(row.kind),
      slot: (row.slot as string | null) ?? null,
      description: null,
    });
    if (rowSlot !== slot) return false;
    const meta = metadataRecord(row.metadata);
    if (meta.content_hash === contentHash) return true;
    return row.file_name === fileName && Number(row.byte_size) === byteSize;
  });
}

async function storeFile(
  supabase: Awaited<ReturnType<typeof requireConfirmedProfile>>["supabase"],
  userId: string,
  documentId: string,
  file: File,
) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
  const storagePath = `${userId}/${documentId}/${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const { error: uploadError } = await supabase.storage.from("cvs").upload(storagePath, bytes, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) return { error: "The file could not be stored.", storagePath: null, mimeType, byteSize: 0, contentHash: "" };
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  return { error: null, storagePath, mimeType, byteSize: file.size, contentHash, bytes: null };
}

export async function uploadProfileDocument(
  _prev: DocumentUploadState,
  formData: FormData,
): Promise<DocumentUploadState> {
  const { supabase, user } = await requireConfirmedProfile();
  const { error: slotError, def } = slotFromForm(formData);
  if (slotError || !def) return { error: slotError ?? "Invalid upload.", ok: false };

  if (def.slot === "work_permit") {
    const block = await assertWorkPermitUploadAllowed(supabase, user.id);
    if (block) return { error: block, ok: false };
  }

  const identitySlotType = identityTypeFromSlot(def.slot);
  if (identitySlotType) {
    const block = await assertIdentityUploadAllowed(supabase, user.id, identitySlotType);
    if (block) return { error: block, ok: false };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file.", ok: false };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "Files need to be 10 MB or smaller.", ok: false };
  }
  if (!extensionAllowed(file.name, file.type, def.accept)) {
    return { error: `Use a supported format (${def.acceptHint}).`, ok: false };
  }

  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 120);
  const certificationName = String(formData.get("certification_name") ?? "").trim().slice(0, 160);
  const issuingInstitution = String(formData.get("issuing_institution") ?? "").trim().slice(0, 160);
  const qualificationLabel = String(formData.get("qualification_label") ?? "").trim().slice(0, 160);
  const educationKey = String(formData.get("education_key") ?? "").trim().slice(0, 200);

  const documentId = crypto.randomUUID();
  const stored = await storeFile(supabase, user.id, documentId, file);
  if (stored.error || !stored.storagePath) {
    return { error: stored.error ?? "Upload failed.", ok: false };
  }

  const duplicate = await findDuplicate(
    supabase,
    user.id,
    def.slot,
    file.name,
    file.size,
    stored.contentHash,
  );
  if (duplicate) {
    await supabase.storage.from("cvs").remove([stored.storagePath]);
    return { error: "This file is already uploaded for this category.", ok: false };
  }

  if (!def.multiple) {
    const { data: all } = await supabase.from("documents").select("id, kind, slot").eq("user_id", user.id);
    const exists = (all ?? []).some(
      (row) =>
        legacySlotForDocument({
          kind: String(row.kind),
          slot: (row.slot as string | null) ?? null,
          description: null,
        }) === def.slot,
    );
    if (exists) {
      await supabase.storage.from("cvs").remove([stored.storagePath]);
      return {
        error: "Replace the existing file using Replace, or delete it first.",
        ok: false,
      };
    }
  }

  const metadata: Record<string, unknown> = {
    content_hash: stored.contentHash,
    display_name: displayName || null,
    certification_name: certificationName || null,
    issuing_institution: issuingInstitution || null,
    qualification_label: qualificationLabel || null,
    education_key: educationKey || null,
  };

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    user_id: user.id,
    kind: def.kind,
    slot: def.slot,
    storage_path: stored.storagePath,
    file_name: file.name,
    mime_type: stored.mimeType,
    byte_size: stored.byteSize,
    status: "uploaded",
    description: displayName || descriptionFromMeta(metadata) || null,
    is_default: false,
    metadata,
  });
  if (insertError) {
    await supabase.storage.from("cvs").remove([stored.storagePath]);
    return { error: "The file was stored but the record could not be saved.", ok: false };
  }

  if (identitySlotType) {
    await persistIdentityDocumentType(supabase, user, identitySlotType);
  }

  revalidatePath("/dashboard/profile");
  return { error: null, ok: true };
}

async function assertWorkPermitUploadAllowed(
  supabase: Awaited<ReturnType<typeof requireConfirmedProfile>>["supabase"],
  userId: string,
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("profile_extended")
    .eq("user_id", userId)
    .maybeSingle();
  const extended = (profile?.profile_extended ?? {}) as Record<string, unknown>;
  const stored = typeof extended.identity_document_type === "string" ? extended.identity_document_type : "";
  if (stored === "sa_id_card") {
    return "Work permit / visa is not used with SA ID card. Choose passport if you need to upload a visa.";
  }
  const { data: docs } = await supabase.from("documents").select("kind, slot").eq("user_id", userId);
  const hasSaId = (docs ?? []).some((row) =>
    SA_ID_CARD_SLOTS.includes(
      legacySlotForDocument({ kind: String(row.kind), slot: (row.slot as string | null) ?? null, description: null }) as (typeof SA_ID_CARD_SLOTS)[number],
    ),
  );
  if (hasSaId && stored !== "passport") {
    return "Remove SA ID card uploads or switch to passport before adding a work permit.";
  }
  return null;
}

async function assertIdentityUploadAllowed(
  supabase: Awaited<ReturnType<typeof requireConfirmedProfile>>["supabase"],
  userId: string,
  uploading: IdentityDocumentType,
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("profile_extended")
    .eq("user_id", userId)
    .maybeSingle();
  const extended = (profile?.profile_extended ?? {}) as Record<string, unknown>;
  const stored = typeof extended.identity_document_type === "string" ? extended.identity_document_type : "";

  const { data: docs } = await supabase
    .from("documents")
    .select("kind, slot")
    .eq("user_id", userId);

  const rows = (docs ?? []).map((row) => ({
    kind: String(row.kind),
    slot: (row.slot as string | null) ?? null,
  }));

  const resolved = resolveIdentityDocumentType(stored, rows, (doc) =>
    legacySlotForDocument({ kind: doc.kind, slot: doc.slot, description: null }),
  );

  const hasSaId = rows.some((row) =>
    SA_ID_CARD_SLOTS.includes(
      legacySlotForDocument({ kind: row.kind, slot: row.slot, description: null }) as (typeof SA_ID_CARD_SLOTS)[number],
    ),
  );
  const hasPassport = rows.some(
    (row) => legacySlotForDocument({ kind: row.kind, slot: row.slot, description: null }) === PASSPORT_SLOT,
  );

  if (uploading === "passport" && hasSaId) {
    return "Remove your SA ID card uploads before adding a passport.";
  }
  if (uploading === "sa_id_card" && hasPassport) {
    return "Remove your passport upload before adding an SA ID card.";
  }
  if (resolved && resolved !== uploading) {
    return uploading === "passport"
      ? "You selected SA ID card. Switch your identity choice or remove SA ID uploads first."
      : "You selected passport. Switch your identity choice or remove your passport first.";
  }
  return null;
}

async function persistIdentityDocumentType(
  supabase: Awaited<ReturnType<typeof requireConfirmedProfile>>["supabase"],
  user: { id: string; email?: string | null },
  type: IdentityDocumentType,
) {
  await ensureProfileForUser(user, supabase);
  const { data: profile, error: readError } = await supabase
    .from("candidate_profiles")
    .select("profile_extended")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) {
    console.error("persistIdentityDocumentType read failed", readError.message);
    return;
  }
  const extended =
    profile?.profile_extended && typeof profile.profile_extended === "object" && !Array.isArray(profile.profile_extended)
      ? (profile.profile_extended as Record<string, unknown>)
      : {};
  if (extended.identity_document_type === type) return;

  const { error } = await supabase
    .from("candidate_profiles")
    .update({ profile_extended: { ...extended, identity_document_type: type } })
    .eq("user_id", user.id);
  if (error) console.error("persistIdentityDocumentType update failed", error.message);
}

function descriptionFromMeta(metadata: Record<string, unknown>) {
  const name = metadata.certification_name ?? metadata.qualification_label ?? metadata.display_name;
  return typeof name === "string" && name.trim() ? name.trim() : "";
}

/** Backwards-compatible upload used by legacy form. */
export async function uploadSupportingDocument(
  _prev: DocumentUploadState,
  formData: FormData,
): Promise<DocumentUploadState> {
  const kindRaw = String(formData.get("kind") ?? "other");
  const mapped = LEGACY_KINDS.includes(kindRaw as (typeof LEGACY_KINDS)[number])
    ? kindRaw
    : "other";
  const slot =
    mapped === "cv"
      ? "cv"
      : mapped === "cover_letter"
        ? "cover_letter"
        : mapped === "professional_certificate"
          ? "professional_certification"
          : mapped === "transcript"
            ? "legacy_transcript"
            : mapped === "certificate"
              ? "legacy_certificate"
              : mapped === "portfolio"
                ? "legacy_portfolio"
                : "other_qualification";
  formData.set("slot", slot);
  return uploadProfileDocument(_prev, formData);
}

export async function replaceProfileDocument(
  _prev: DocumentUploadState,
  formData: FormData,
): Promise<DocumentUploadState> {
  const { supabase, user } = await requireConfirmedProfile();
  const replaceId = String(formData.get("replace_id") ?? "").trim();
  if (!replaceId) return { error: "Missing document to replace.", ok: false };

  const { data: existing } = await supabase
    .from("documents")
    .select("id, slot, kind, storage_path, metadata")
    .eq("id", replaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "Document not found.", ok: false };

  const slot = (existing.slot as string | null) ?? String(formData.get("slot") ?? "");
  formData.set("slot", slot);
  const { error: slotError, def } = slotFromForm(formData);
  if (slotError || !def) return { error: slotError ?? "Invalid upload.", ok: false };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file.", ok: false };
  }

  const documentId = crypto.randomUUID();
  const stored = await storeFile(supabase, user.id, documentId, file);
  if (stored.error || !stored.storagePath) {
    return { error: stored.error ?? "Upload failed.", ok: false };
  }

  const duplicate = await findDuplicate(
    supabase,
    user.id,
    def.slot,
    file.name,
    file.size,
    stored.contentHash,
    replaceId,
  );
  if (duplicate) {
    await supabase.storage.from("cvs").remove([stored.storagePath]);
    return { error: "This file is already uploaded for this category.", ok: false };
  }

  const priorMeta = metadataRecord(existing.metadata);
  const metadata = {
    ...priorMeta,
    content_hash: stored.contentHash,
    display_name: String(formData.get("display_name") ?? priorMeta.display_name ?? "").trim() || null,
  };

  await supabase.storage.from("cvs").remove([existing.storage_path as string]);
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      storage_path: stored.storagePath,
      file_name: file.name,
      mime_type: stored.mimeType,
      byte_size: stored.byteSize,
      status: "uploaded",
      metadata,
      description: descriptionFromMeta(metadata) || null,
    })
    .eq("id", replaceId)
    .eq("user_id", user.id);

  if (updateError) {
    await supabase.storage.from("cvs").remove([stored.storagePath]);
    return { error: "Could not replace the file.", ok: false };
  }

  revalidatePath("/dashboard/profile");
  return { error: null, ok: true };
}

export async function setDefaultCv(documentId: string): Promise<DocumentUploadState> {
  const { supabase, user } = await requireConfirmedProfile();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, kind, slot")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!doc || (doc.kind !== "cv" && doc.slot !== "cv")) {
    return { error: "Choose a CV you uploaded.", ok: false };
  }

  await supabase.from("documents").update({ is_default: false }).eq("user_id", user.id).eq("kind", "cv");
  const { error } = await supabase
    .from("documents")
    .update({ is_default: true })
    .eq("id", documentId)
    .eq("user_id", user.id);
  if (error) return { error: "Could not set the default CV.", ok: false };
  revalidatePath("/dashboard/profile");
  return { error: null, ok: true };
}

export async function deleteDocument(documentId: string): Promise<DocumentUploadState> {
  const { supabase, user } = await requireConfirmedProfile();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, storage_path, kind")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!doc) return { error: "Document not found.", ok: false };

  if (doc.kind !== "tailored_cv") {
    await supabase.storage.from("cvs").remove([doc.storage_path as string]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", documentId).eq("user_id", user.id);
  if (error) return { error: "The document could not be deleted.", ok: false };
  revalidatePath("/dashboard/profile");
  return { error: null, ok: true };
}

export async function signedDocumentUrl(documentId: string): Promise<{ url: string | null; error: string | null }> {
  const { supabase, user } = await requireConfirmedProfile();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, kind")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!doc?.storage_path) return { url: null, error: "Document not found." };
  if (doc.kind === "tailored_cv") {
    return { url: null, error: "Open tailored documents from the application page." };
  }

  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(doc.storage_path as string, 120);
  if (error || !data?.signedUrl) return { url: null, error: "Could not create a secure download link." };
  return { url: data.signedUrl, error: null };
}

export async function setIdentityDocumentType(type: IdentityDocumentType | ""): Promise<DocumentUploadState> {
  const { supabase, user } = await requireConfirmedProfile();
  const { data: docs } = await supabase.from("documents").select("kind, slot").eq("user_id", user.id);
  const rows = (docs ?? []).map((row) => ({
    kind: String(row.kind),
    slot: (row.slot as string | null) ?? null,
  }));
  const hasSaId = rows.some((row) =>
    SA_ID_CARD_SLOTS.includes(
      legacySlotForDocument({ kind: row.kind, slot: row.slot, description: null }) as (typeof SA_ID_CARD_SLOTS)[number],
    ),
  );
  const hasPassport = rows.some(
    (row) => legacySlotForDocument({ kind: row.kind, slot: row.slot, description: null }) === PASSPORT_SLOT,
  );

  if (type === "passport" && hasSaId) {
    return { error: "Delete your SA ID card uploads before switching to passport.", ok: false };
  }
  if (type === "sa_id_card" && hasPassport) {
    return { error: "Delete your passport before switching to SA ID card.", ok: false };
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("profile_extended")
    .eq("user_id", user.id)
    .maybeSingle();
  const extended = (profile?.profile_extended ?? {}) as Record<string, unknown>;
  const { error } = await supabase
    .from("candidate_profiles")
    .update({ profile_extended: { ...extended, identity_document_type: type } })
    .eq("user_id", user.id);
  if (error) return { error: "Could not save your choice.", ok: false };
  revalidatePath("/dashboard/profile");
  return { error: null, ok: true };
}

export async function setSlotInProgress(slot: string, inProgress: boolean): Promise<DocumentUploadState> {
  const def = getDocumentSlot(slot);
  if (!def?.allowInProgress) {
    return { error: "This category does not support in-progress status.", ok: false };
  }
  const { supabase, user } = await requireConfirmedProfile();
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("profile_extended")
    .eq("user_id", user.id)
    .maybeSingle();
  const extended = (profile?.profile_extended ?? {}) as Record<string, unknown>;
  const progress = (extended.document_slot_progress ?? {}) as Record<string, { in_progress?: boolean }>;
  if (inProgress) progress[slot] = { in_progress: true };
  else delete progress[slot];

  const { error } = await supabase
    .from("candidate_profiles")
    .update({ profile_extended: { ...extended, document_slot_progress: progress } })
    .eq("user_id", user.id);
  if (error) return { error: "Could not save progress.", ok: false };
  revalidatePath("/dashboard/profile");
  return { error: null, ok: true };
}
