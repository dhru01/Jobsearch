"use server";

import { revalidatePath } from "next/cache";
import { extractCvFacts, ExtractionNotConfiguredError } from "@/lib/ai/extract-cv";
import { requireUser } from "@/lib/auth";
import { detectCvType, extractCvText } from "@/lib/cv/parse";

const MAX_BYTES = 10 * 1024 * 1024;

export type UploadState = {
  error: string | null;
  ok: boolean;
  note: string | null;
};

export async function uploadCv(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const { supabase, user } = await requireUser();
  const file = formData.get("cv");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF or DOCX file.", ok: false, note: null };
  }
  if (file.size > MAX_BYTES) {
    return { error: "CV files need to be 10 MB or smaller.", ok: false, note: null };
  }
  if (!detectCvType(file.name, file.type)) {
    return { error: "Upload a PDF or DOCX file.", ok: false, note: null };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";
  try {
    text = await extractCvText(file.name, file.type, bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read that file.";
    return { error: message, ok: false, note: null };
  }

  if (text.length < 20) {
    return {
      error: "This file has no selectable text. Enter your profile manually, or upload a text-based PDF or DOCX.",
      ok: false,
      note: null,
    };
  }

  let extracted: unknown = null;
  let errorMessage: string | null = null;
  let status: "extracted" | "failed" = "extracted";

  try {
    extracted = await extractCvFacts(text);
  } catch (error) {
    status = "failed";
    errorMessage =
      error instanceof ExtractionNotConfiguredError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Extraction failed. You can enter your profile manually.";
  }

  const documentId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "cv";
  const storagePath = `${user.id}/${documentId}/${safeName}`;
  const mimeType =
    file.type ||
    (safeName.endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

  const { error: uploadError } = await supabase.storage.from("cvs").upload(storagePath, bytes, {
    contentType: mimeType,
    upsert: false,
  });

  if (uploadError) {
    console.error("CV upload failed", uploadError.message);
    return { error: "The file could not be stored. Try again.", ok: false, note: null };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    user_id: user.id,
    kind: "cv",
    storage_path: storagePath,
    file_name: file.name,
    mime_type: mimeType,
    byte_size: file.size,
    extracted_json: extracted,
    error_message: errorMessage,
    status,
  });

  if (insertError) {
    console.error("CV document insert failed", insertError.message);
    return { error: "The file was stored, but the profile draft could not be saved.", ok: false, note: null };
  }

  revalidatePath("/onboarding");

  if (errorMessage) {
    return { error: errorMessage, ok: false, note: null };
  }

  return {
    error: null,
    ok: true,
    note:
      text.length >= 24000
        ? "Only the first part of this CV was sent for extraction. Check that nothing important was cut off."
        : "Review every field. Nothing is treated as verified until you confirm.",
  };
}
