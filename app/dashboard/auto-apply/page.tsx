import { Suspense } from "react";
import { LoadingBlock } from "@/components/loading-block";
import { requireConfirmedProfile } from "@/lib/auth";
import { normalizePreferences } from "@/lib/apply/preferences";
import { AutoApplyForm } from "@/components/auto-apply-form";

export const instant = false;

export default function AutoApplyPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading auto-apply settings" />}>
      <AutoApply />
    </Suspense>
  );
}

async function AutoApply() {
  const { supabase, user } = await requireConfirmedProfile();
  const { data } = await supabase.from("application_preferences").select("*").eq("user_id", user.id).maybeSingle();
  const prefs = normalizePreferences(data as Record<string, unknown> | null, user.id);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-accent">Auto-apply</p>
        <h1 className="mt-2 text-4xl leading-none sm:text-5xl">How Fieldwork should apply</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Default is approval required. Automatic submit only runs on the local mock form until you explicitly enable a
          permitted workflow. PNet, LinkedIn, and Indeed stay assisted.
        </p>
      </header>
      <AutoApplyForm prefs={prefs} />
    </div>
  );
}
