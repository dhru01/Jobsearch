"use client";

import { PROFILE_TABS, type ProfileTabId } from "@/lib/profile/constants";
import type { TabReadiness } from "@/lib/profile/readiness";

export function ProfileTabs({
  active,
  onChange,
  readiness,
}: {
  active: ProfileTabId;
  onChange: (id: ProfileTabId) => void;
  readiness: TabReadiness[];
}) {
  const completeCount = readiness.filter((item) => item.complete).length;

  return (
    <div className="rounded-[1.25rem] border border-line bg-panel/55 p-2 shadow-[inset_0_1px_0_rgba(255,253,248,0.65)]">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Profile sections</p>
        <p className="text-[11px] font-medium tabular-nums text-muted">
          <span className="text-ink">{completeCount}</span>/{PROFILE_TABS.length}
        </p>
      </div>
      <div
        className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
        role="tablist"
        aria-label="Profile sections"
      >
        {PROFILE_TABS.map((tab) => {
          const selected = tab.id === active;
          const status = readiness.find((item) => item.id === tab.id);
          const complete = Boolean(status?.complete);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`profile-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`profile-panel-${tab.id}`}
              className={`flex w-full min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-left text-xs leading-snug transition sm:px-3 sm:text-sm ${
                selected
                  ? "bg-raised font-medium text-ink shadow-sm ring-1 ring-line"
                  : "text-muted hover:bg-raised/80 hover:text-ink"
              }`}
              onClick={() => onChange(tab.id)}
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  complete ? "bg-good shadow-[0_0_0_2px_rgba(27,94,69,0.18)]" : "border border-warn/50 bg-warn-bg"
                }`}
                aria-hidden
              />
              {tab.label}
              <span className="sr-only">{complete ? ", complete" : ", incomplete"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
