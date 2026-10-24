import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplicationAnswersPanel } from "@/components/application-answers-panel";
import { ApplicationTimeline } from "@/components/application-timeline";
import { ApplicationDocumentChecklist } from "@/components/application-document-checklist";
import { AssistedApplyPanel } from "@/components/assisted-apply-panel";
import { TailoredDocumentEditor } from "@/components/tailored-document-editor";
import { LoadingBlock } from "@/components/loading-block";
import { parseTailoredDocumentMeta } from "@/lib/documents/tailored-types";
import { requireConfirmedProfile } from "@/lib/auth";
import { one, workModeLabel } from "@/lib/labels";

export const instant = false;

type JobRow = {
  title: string;
  company: string;
  location: string;
  original_url: string;
  work_mode: string;
  is_stale: boolean;
  min_qualification: string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ApplicationDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading application" />}>
      <ApplicationDetail params={params} />
    </Suspense>
  );
}

async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireConfirmedProfile();

  const { data: application, error } = await supabase
    .from("applications")
    .select(
      "id, status, notes, created_at, workflow, error_message, jobs(title, company, location, original_url, work_mode, is_stale, min_qualification)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  const job = one(application?.jobs as JobRow | JobRow[] | null);
  if (!application || !job) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, extracted_json, created_at")
    .eq("user_id", user.id)
    .eq("kind", "tailored_cv")
    .order("created_at", { ascending: false })
    .limit(20);

  let documentId: string | null = null;
  let meta = null;
  for (const row of documents ?? []) {
    const parsed = parseTailoredDocumentMeta(row.extracted_json);
    if (parsed?.application_id === application.id) {
      documentId = row.id as string;
      meta = parsed;
      break;
    }
  }

  const { data: profileDocuments } = await supabase
    .from("documents")
    .select("id, kind, slot, file_name, description, metadata")
    .eq("user_id", user.id)
    .neq("kind", "tailored_cv");

  const { data: answers } = await supabase
    .from("application_answers")
    .select("id, question, answer, needs_user, source")
    .eq("application_id", application.id)
    .order("created_at", { ascending: true });

  const { data: events } = await supabase
    .from("application_events")
    .select("id, event_type, created_at")
    .eq("application_id", application.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/applications" className="text-sm text-muted underline-offset-4 hover:underline">
          ← Applications
        </Link>
        <p className="mt-4 text-sm font-medium text-accent">Prepare application</p>
        <h1 className="mt-2 text-4xl leading-none sm:text-5xl">{job.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {job.company} · {job.location} · {workModeLabel(job.work_mode)}
        </p>
        {job.is_stale ? (
          <p className="mt-2 text-sm text-warn">This listing may be stale. Check the posting before you apply.</p>
        ) : null}
      </header>

      <ApplicationDocumentChecklist
        jobTitle={job.title}
        minQualification={job.min_qualification}
        documents={(profileDocuments ?? []).map((doc) => ({
          id: String(doc.id),
          kind: String(doc.kind),
          slot: (doc.slot as string | null) ?? null,
          file_name: String(doc.file_name),
          description: (doc.description as string | null) ?? null,
          metadata:
            doc.metadata && typeof doc.metadata === "object" && !Array.isArray(doc.metadata)
              ? (doc.metadata as Record<string, unknown>)
              : null,
        }))}
        profileExtended={profile.extended}
      />

      <ApplicationAnswersPanel
        applicationId={application.id}
        answers={answers ?? []}
        workflow={application.workflow}
        errorMessage={application.error_message}
      />

      <AssistedApplyPanel
        applicationId={application.id}
        status={application.status}
        hasDocuments={Boolean(meta)}
        notes={application.notes}
      />

      <TailoredDocumentEditor
        applicationId={application.id}
        documentId={documentId}
        meta={meta}
        postingUrl={job.original_url}
        applicationStatus={application.status}
      />

      <ApplicationTimeline events={events ?? []} />
    </div>
  );
}
