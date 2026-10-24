import { Suspense } from "react";
import Link from "next/link";
import { LoadingBlock } from "@/components/loading-block";
import { requireConfirmedProfile } from "@/lib/auth";
import { profileCompleteness } from "@/lib/profile";

export const instant = false;

export default function OverviewPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading overview" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const { supabase, user, profile } = await requireConfirmedProfile();
  const [{ count: matchCount }, { count: eligibleCount }, { count: applicationCount }] = await Promise.all([
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("eligibility_pass", true),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const { data: prefs } = await supabase
    .from("application_preferences")
    .select("mode, paused")
    .eq("user_id", user.id)
    .maybeSingle();
  const { count: attentionCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["awaiting_approval", "action_required", "failed"]);

  const completeness = profileCompleteness(profile);
  const first = profile.full_name?.split(" ")[0];
  const next =
    completeness.percent < 80
      ? { href: "/dashboard/profile", label: "Add the missing profile details so matching has more confirmed facts." }
      : (attentionCount ?? 0) > 0
        ? { href: "/dashboard/applications", label: "Applications need your review or extra information." }
        : (applicationCount ?? 0) === 0
          ? { href: "/dashboard/matches", label: "Review your matches and save the roles you want to track." }
          : { href: "/dashboard/applications", label: "Track applications. Fieldwork does not auto-submit PNet, LinkedIn, or Indeed." };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-accent">Overview</p>
        <h1 className="mt-2 text-4xl leading-none sm:text-5xl">{first ? `Hello, ${first}.` : "Hello."}</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          South African vacancies from ingestion and development seed data, scored from the profile you confirmed.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Profile completeness" value={`${completeness.percent}%`} />
        <Stat label="Eligible matches" value={`${eligibleCount ?? 0}`} detail={`of ${matchCount ?? 0}`} />
        <Stat label="Applications" value={String(applicationCount ?? 0)} />
        <Stat label="Needs attention" value={String(attentionCount ?? 0)} />
        <Stat
          label="Auto-apply"
          value={prefs?.paused ? "Paused" : prefs?.mode === "automatic" ? "Automatic*" : prefs?.mode === "manual" ? "Manual" : "Approval"}
        />
      </div>
      {completeness.missing.length > 0 ? (
        <p className="text-sm text-muted">Missing: {completeness.missing.join(", ")}.</p>
      ) : null}
      <p className="text-xs text-muted">* Automatic still cannot submit to PNet, LinkedIn, or Indeed.</p>
      <Link
        href={next.href}
        className="block rounded-[1.75rem] bg-ink px-6 py-6 text-bg transition hover:bg-accent"
      >
        <p className="text-xs font-medium tracking-[0.16em] text-bg/60 uppercase">Next</p>
        <p className="mt-2 max-w-xl text-2xl leading-tight">{next.label}</p>
      </Link>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-line bg-raised px-5 py-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 font-display text-4xl leading-none tracking-tight">
        {value}
        {detail ? <span className="ml-2 text-lg text-muted">{detail}</span> : null}
      </p>
    </div>
  );
}
