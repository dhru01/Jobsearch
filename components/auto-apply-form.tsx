"use client";

import { useActionState } from "react";
import type { ApplicationPreferences } from "@/lib/apply/preferences";
import { runEnqueueNow, saveAutoApplySettings, type AutoApplyState } from "@/lib/actions/auto-apply";
import { fieldClass, FieldLabel, Alert } from "@/components/field";

const initial: AutoApplyState = { error: null, ok: false, note: null };

export function AutoApplyForm({ prefs }: { prefs: ApplicationPreferences }) {
  const [saveState, save, saving] = useActionState(saveAutoApplySettings, initial);
  const [queueState, queue, queueing] = useActionState(async (_prev: AutoApplyState) => runEnqueueNow(), initial);

  return (
    <div className="space-y-6">
      <form action={save} className="space-y-5 rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Mode</legend>
          {(
            [
              ["manual", "Manual — discover and recommend only"],
              ["approval_required", "Approval required — prepare, then you approve"],
              ["automatic", "Automatic — submit on supported workflows only"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-start gap-2 text-sm">
              <input type="radio" name="mode" value={value} defaultChecked={prefs.mode === value} className="mt-1 accent-accent" />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="auto_submit_consent" defaultChecked={Boolean(prefs.auto_submit_consent_at)} className="mt-1 accent-accent" />
          I authorise Fieldwork to submit applications on my behalf on supported, permitted workflows. I understand PNet,
          LinkedIn, and Indeed are not auto-submitted.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="paused" defaultChecked={prefs.paused} className="accent-accent" />
          Pause automatic applications
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="min_score">Minimum match score</FieldLabel>
            <input id="min_score" name="min_score" type="number" min={0} max={100} defaultValue={prefs.min_score} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="max_per_day">Max applications per day</FieldLabel>
            <input id="max_per_day" name="max_per_day" type="number" min={0} max={50} defaultValue={prefs.max_per_day} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="preferred_titles">Preferred titles</FieldLabel>
            <input id="preferred_titles" name="preferred_titles" defaultValue={prefs.preferred_titles.join(", ")} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="preferred_locations">Preferred locations</FieldLabel>
            <input id="preferred_locations" name="preferred_locations" defaultValue={prefs.preferred_locations.join(", ")} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="min_salary">Minimum salary (ZAR)</FieldLabel>
            <input id="min_salary" name="min_salary" type="number" defaultValue={prefs.min_salary ?? ""} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="employment_types">Employment types</FieldLabel>
            <input id="employment_types" name="employment_types" defaultValue={prefs.employment_types.join(", ")} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="excluded_companies">Excluded companies</FieldLabel>
            <input id="excluded_companies" name="excluded_companies" defaultValue={prefs.excluded_companies.join(", ")} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="excluded_industries">Excluded industries</FieldLabel>
            <input id="excluded_industries" name="excluded_industries" defaultValue={prefs.excluded_industries.join(", ")} className={fieldClass} />
          </div>
        </div>
        {saveState.error ? <Alert>{saveState.error}</Alert> : null}
        {saveState.note ? <p className="text-sm text-good">{saveState.note}</p> : null}
        <button type="submit" disabled={saving} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <form action={queue} className="rounded-[1.75rem] border border-line bg-raised p-5">
        <p className="text-sm text-muted">Queue eligible matches for review using these settings. Does not submit to employer sites.</p>
        <button type="submit" disabled={queueing} className="mt-4 rounded-full border border-line bg-bg px-4 py-2 text-sm disabled:opacity-60">
          {queueing ? "Queueing…" : "Queue matching jobs for approval"}
        </button>
        {queueState.note ? <p className="mt-3 text-sm text-good">{queueState.note}</p> : null}
        {queueState.error ? <p className="mt-3 text-sm text-warn">{queueState.error}</p> : null}
      </form>
    </div>
  );
}
