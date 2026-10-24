"use server";

import { revalidatePath } from "next/cache";
import { tailorDocumentsForJob } from "@/lib/ai/tailor-documents";
import {
  parseTailoredDocumentMeta,
  tailoredCvSchema,
  type TailoredDocumentMeta,
} from "@/lib/documents/tailored-types";
import { renderCoverLetterPdf, renderTailoredCvPdf } from "@/lib/documents/render-pdf";
import { canGenerateTailoredDocuments } from "@/lib/billing/entitlements";
import { requireConfirmedProfile } from "@/lib/auth";
import { one } from "@/lib/labels";

export type TailorActionState = {
  error: string | null;
  ok: boolean;
  note: string | null;
};

const emptyState: TailorActionState = { error: null, ok: false, note: null };

type JobRow = {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  skills: string[] | null;
  original_url: string;
  is_stale: boolean;
};

async function loadApplication(applicationId: string) {
  const { supabase, user, profile } = await requireConfirmedProfile();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, job_id, jobs(id, title, company, description, requirements, skills, original_url, is_stale)",
    )
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  const job = one(data?.jobs as JobRow | JobRow[] | null);
  if (!data || !job) {
    return null;
  }

  return { supabase, user, profile, application: data, job };
}

async function latestTailoredDocument(
  supabase: Awaited<ReturnType<typeof requireConfirmedProfile>>["supabase"],
  userId: string,
  applicationId: string,
) {
  const { data } = await supabase
    .from("documents")
    .select("id, extracted_json, storage_path, created_at")
    .eq("user_id", userId)
    .eq("kind", "tailored_cv")
    .order("created_at", { ascending: false })
    .limit(20);

  for (const row of data ?? []) {
    const meta = parseTailoredDocumentMeta(row.extracted_json);
    if (meta?.application_id === applicationId) {
      return { id: row.id as string, meta, storage_path: row.storage_path as string };
    }
  }
  return null;
}

export async function generateTailoredDocuments(
  _prev: TailorActionState,
  formData: FormData,
): Promise<TailorActionState> {
  const applicationId = String(formData.get("application_id") ?? "");
  if (!applicationId) return { ...emptyState, error: "Missing application." };

  const ctx = await loadApplication(applicationId);
  if (!ctx) return { ...emptyState, error: "Application not found." };

  const { supabase, user, profile, application, job } = ctx;

  const entitlement = await canGenerateTailoredDocuments(supabase, user.id);
  if (!entitlement.allowed) {
    return {
      ...emptyState,
      error: `Free plan includes ${entitlement.limit} tailored document sets per month. Upgrade to Pro for unlimited tailoring.`,
    };
  }

  try {
    const tailored = await tailorDocumentsForJob(profile, {
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills ?? [],
    });

    const meta: TailoredDocumentMeta = {
      version: 1,
      application_id: application.id,
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      cv: tailored.cv,
      cover_letter: tailored.cover_letter,
    };

    const documentId = crypto.randomUUID();
    const storagePath = `${user.id}/${documentId}/tailored-cv.pdf`;

    const { error: insertError } = await supabase.from("documents").insert({
      id: documentId,
      user_id: user.id,
      kind: "tailored_cv",
      storage_path: storagePath,
      file_name: `CV-${job.company.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40)}.pdf`,
      mime_type: "application/pdf",
      byte_size: 0,
      extracted_json: meta,
      status: "extracted",
    });

    if (insertError) {
      console.error("Tailored document insert failed", insertError.message);
      return { ...emptyState, error: "Could not save the draft documents." };
    }

    const nextStatus = application.status === "saved" ? "draft" : application.status;
    await supabase.from("applications").update({ status: nextStatus }).eq("id", application.id);

    await supabase.from("application_events").insert({
      application_id: application.id,
      user_id: user.id,
      event_type: "documents_generated",
      payload: { document_id: documentId, used_ai: tailored.usedAi },
    });

    revalidatePath(`/dashboard/applications/${applicationId}`);
    revalidatePath("/dashboard/applications");

    return {
      error: null,
      ok: true,
      note: tailored.usedAi
        ? "Draft CV and cover letter generated. Review every line before downloading."
        : "Draft created from your confirmed profile (no OpenAI key). Review before downloading.",
    };
  } catch (error) {
    console.error("Generate tailored documents failed", error);
    return { ...emptyState, error: "Generation failed. Try again in a moment." };
  }
}

export async function saveTailoredDocumentReview(
  _prev: TailorActionState,
  formData: FormData,
): Promise<TailorActionState> {
  const applicationId = String(formData.get("application_id") ?? "");
  const documentId = String(formData.get("document_id") ?? "");
  if (!applicationId || !documentId) return { ...emptyState, error: "Missing application." };

  const ctx = await loadApplication(applicationId);
  if (!ctx) return { ...emptyState, error: "Application not found." };

  const { supabase, user, application } = ctx;
  const existing = await latestTailoredDocument(supabase, user.id, applicationId);
  if (!existing || existing.id !== documentId) {
    return { ...emptyState, error: "Generate documents before saving a review." };
  }

  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  const cvInput = {
    full_name: String(formData.get("full_name") ?? existing.meta.cv.full_name),
    email: String(formData.get("email") ?? existing.meta.cv.email),
    phone: String(formData.get("phone") ?? existing.meta.cv.phone),
    location: String(formData.get("location") ?? existing.meta.cv.location),
    headline: String(formData.get("headline") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    skills,
    experience: existing.meta.cv.experience.map((item, index) => ({
      ...item,
      summary: String(formData.get(`experience_summary_${index}`) ?? item.summary),
    })),
    education: existing.meta.cv.education,
    qualifications: existing.meta.cv.qualifications,
  };

  const parsedCv = tailoredCvSchema.safeParse(cvInput);
  if (!parsedCv.success) {
    return { ...emptyState, error: "Check the CV fields and try again." };
  }

  const coverLetter = String(formData.get("cover_letter") ?? "").trim();
  const meta: TailoredDocumentMeta = {
    ...existing.meta,
    cv: parsedCv.data,
    cover_letter: coverLetter,
  };

  const { error: updateError } = await supabase
    .from("documents")
    .update({ extracted_json: meta, status: "confirmed" })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Tailored document update failed", updateError.message);
    return { ...emptyState, error: "Could not save your edits." };
  }

  await supabase.from("applications").update({ status: "prepared" }).eq("id", application.id);

  await supabase.from("application_events").insert({
    application_id: application.id,
    user_id: user.id,
    event_type: "documents_reviewed",
    payload: { document_id: documentId },
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/applications");

  return {
    error: null,
    ok: true,
    note: "Review saved. Download the PDFs when you are ready to apply on the employer site.",
  };
}

export async function recordApplicationOpened(applicationId: string) {
  const ctx = await loadApplication(applicationId);
  if (!ctx) return;

  const { supabase, user, application } = ctx;
  const status = application.status === "submitted" ? "submitted" : "opened";

  await supabase.from("applications").update({ status }).eq("id", application.id);
  await supabase.from("application_events").insert({
    application_id: application.id,
    user_id: user.id,
    event_type: "posting_opened",
    payload: {},
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/applications");
}

export async function buildTailoredPdf(
  applicationId: string,
  kind: "cv" | "cover",
): Promise<{ bytes: Buffer; fileName: string } | null> {
  const ctx = await loadApplication(applicationId);
  if (!ctx) return null;

  const { supabase, user } = ctx;
  const doc = await latestTailoredDocument(supabase, user.id, applicationId);
  if (!doc) return null;

  const cv = doc.meta.cv;
  const bytes =
    kind === "cv"
      ? await renderTailoredCvPdf(cv)
      : await renderCoverLetterPdf(doc.meta.cover_letter, cv);

  const fileName =
    kind === "cv"
      ? doc.meta.company
        ? `CV-${doc.meta.company.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`
        : "tailored-cv.pdf"
      : doc.meta.company
        ? `Cover-${doc.meta.company.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`
        : "cover-letter.pdf";

  const pdfPath =
    kind === "cv"
      ? doc.storage_path
      : doc.storage_path.replace(/tailored-cv\.pdf$/, "cover-letter.pdf");

  await supabase.storage.from("cvs").upload(pdfPath, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (kind === "cv") {
    await supabase
      .from("documents")
      .update({ byte_size: bytes.length, storage_path: pdfPath })
      .eq("id", doc.id);
  }

  return { bytes, fileName };
}
