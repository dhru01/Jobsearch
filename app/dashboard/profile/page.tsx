import { Suspense } from "react";
import { LoadingBlock } from "@/components/loading-block";
import { deleteAccount } from "@/lib/actions/account";
import { ProfileForm } from "@/components/profile-form";
import { requireConfirmedProfile } from "@/lib/auth";
import { draftFromProfile } from "@/lib/profile";

export const instant = false;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function ProfilePage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading profile" />}>
      <ProfileEditor searchParams={searchParams} />
    </Suspense>
  );
}

async function ProfileEditor({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase, user, profile } = await requireConfirmedProfile();
  const [{ data: meta }, { data: documents }] = await Promise.all([
    supabase.from("candidate_profiles").select("updated_at").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const saved = params.saved === "1";
  const rescoreFailed = params.rescore === "failed";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-accent">Profile</p>
        <h1 className="mt-2 text-4xl leading-none sm:text-5xl">Facts you confirmed</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
          Matching and applications use only this confirmed profile. Complete each tab, then save. Switching tabs keeps
          your draft.
        </p>
      </header>
      {saved ? (
        <p className="rounded-2xl bg-good-bg px-4 py-3 text-sm text-good">
          Profile saved.
          {rescoreFailed ? " Matches could not be refreshed — save again in a moment." : " Matches were rescored."}
        </p>
      ) : null}
      <ProfileForm
        key={String(meta?.updated_at ?? profile.id)}
        initialDraft={draftFromProfile(profile, user.email ?? "")}
        mode="edit"
        initialTab={typeof params.tab === "string" ? params.tab : Array.isArray(params.tab) ? params.tab[0] : undefined}
        documents={(documents ?? [])
          .filter((doc) => doc.kind !== "tailored_cv")
          .map((doc) => ({
          id: String(doc.id),
          kind: String(doc.kind),
          slot: (doc.slot as string | null) ?? null,
          file_name: String(doc.file_name),
          mime_type: (doc.mime_type as string | null) ?? null,
          byte_size: doc.byte_size == null ? null : Number(doc.byte_size),
          created_at: String(doc.created_at),
          description: (doc.description as string | null) ?? null,
          is_default: Boolean(doc.is_default),
          metadata:
            doc.metadata && typeof doc.metadata === "object" && !Array.isArray(doc.metadata)
              ? (doc.metadata as Record<string, unknown>)
              : null,
          status: (doc.status as string | null) ?? null,
        }))}
      />
      <section className="rounded-[1.5rem] border border-line bg-raised p-5 text-sm">
        <p>
          <a href="/privacy" className="underline underline-offset-4">
            Privacy notice
          </a>
        </p>
        <form action={deleteAccount} className="mt-4">
          <button type="submit" className="text-sm text-warn underline-offset-4 hover:underline">
            Delete my account and data
          </button>
        </form>
      </section>
    </div>
  );
}
