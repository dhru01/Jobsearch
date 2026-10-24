import { AuthCard } from "@/components/auth-card";
import { Notice } from "@/components/field";
import { ProfileForm } from "@/components/profile-form";
import { UploadForm } from "@/components/upload-form";
import { ensureProfileForUser, requireUser } from "@/lib/auth";
import { applyExtraction, draftFromProfile } from "@/lib/profile";
import type { ExtractedCv } from "@/lib/ai/extract-cv";
import { redirect } from "next/navigation";

export const instant = false;

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const profile = await ensureProfileForUser(user, supabase);
  if (profile.extraction_status === "confirmed") redirect("/dashboard");

  const { data: documents } = await supabase
    .from("documents")
    .select("id, file_name, status, extracted_json, error_message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const latest = documents?.[0];
  const extractedDocument = documents?.find((document) => document.status === "extracted");
  const base = draftFromProfile(profile, user.email ?? "");
  const initial = extractedDocument?.extracted_json
    ? applyExtraction(base, extractedDocument.extracted_json as ExtractedCv)
    : base;

  return (
    <AuthCard
      width="max-w-3xl"
      title="Confirm your profile"
      lede="Upload a CV if you have one. Correct anything that was extracted, then confirm. Unconfirmed text is never used for matching."
    >
      <div className="space-y-6">
        <UploadForm />
        {latest?.status === "failed" && latest.error_message ? <Notice>{latest.error_message}</Notice> : null}
        {extractedDocument ? (
          <p className="text-sm text-muted">Draft taken from {extractedDocument.file_name}. Edit it before you confirm.</p>
        ) : (
          <p className="text-sm text-muted">You can fill this in by hand, or use the demo profile.</p>
        )}
        <ProfileForm
          key={extractedDocument?.id ?? "manual"}
          initialDraft={initial}
          mode="confirm"
        />
      </div>
    </AuthCard>
  );
}
