"use client";

import type { ProfileTabId } from "@/lib/profile/constants";
import type { TabReadiness } from "@/lib/profile/readiness";

type ReadinessSummary = {
  tabs: TabReadiness[];
  percent: number;
  matchingReady: boolean;
  applicationReady: boolean;
  messages: string[];
};

const TAB_SHORT: Record<ProfileTabId, string> = {
  personal: "Personal",
  professional: "Professional",
  education: "Education",
  experience: "Experience",
  documents: "Documents",
  questions: "Questions",
  additional: "Additional",
  privacy: "Privacy",
};

function ProgressRing({ percent }: { percent: number }) {
  const size = 108;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative mx-auto size-[6.75rem]" aria-hidden>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center text-center leading-none">
          <span className="font-display text-3xl text-ink tabular-nums">{percent}</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">percent</span>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-good-bg text-good">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-warn/40 bg-warn-bg text-[10px] font-semibold text-warn">
      !
    </span>
  );
}

export function ProfileReadinessPanel({
  readiness,
  activeTab,
  onJump,
  dirty,
}: {
  readiness: ReadinessSummary;
  activeTab: ProfileTabId;
  onJump: (id: ProfileTabId) => void;
  dirty?: boolean;
}) {
  const completeCount = readiness.tabs.filter((tab) => tab.complete).length;
  const nextIncomplete = readiness.tabs.find((tab) => !tab.complete);

  return (
    <aside
      className="overflow-hidden rounded-[1.5rem] border border-line bg-gradient-to-b from-raised via-raised to-panel/50 shadow-[0_18px_40px_-28px_rgba(28,22,18,0.45)] lg:sticky lg:top-20"
      aria-label="Profile readiness"
    >
      <div className="border-b border-line/80 bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(194,65,12,0.14),transparent_55%)] px-5 pb-5 pt-5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Profile readiness</p>
        <div className="mt-3">
          <ProgressRing percent={readiness.percent} />
        </div>
        <p className="mt-3 text-center text-sm leading-snug text-muted">
          {readiness.matchingReady
            ? "You’re set for job matching."
            : "Finish the highlighted sections to unlock stronger matches."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              readiness.matchingReady ? "bg-good-bg text-good" : "bg-panel text-muted"
            }`}
          >
            Matching {readiness.matchingReady ? "ready" : "in progress"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              readiness.applicationReady ? "bg-good-bg text-good" : "bg-panel text-muted"
            }`}
          >
            Applications {readiness.applicationReady ? "ready" : "in progress"}
          </span>
        </div>
        {dirty ? (
          <p className="mt-3 text-center text-xs font-medium text-warn">Unsaved changes on this page</p>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {completeCount} of {readiness.tabs.length} complete
        </p>
        <ul className="space-y-1">
          {readiness.tabs.map((item) => {
            const selected = item.id === activeTab;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onJump(item.id)}
                  className={`group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                    selected ? "bg-panel ring-1 ring-line" : "hover:bg-panel/70"
                  }`}
                >
                  <StatusIcon complete={item.complete} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-sm ${selected ? "font-medium text-ink" : "text-ink/90"}`}>
                        {TAB_SHORT[item.id]}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                          item.complete ? "text-good" : "text-warn"
                        }`}
                      >
                        {item.complete ? "Done" : "To do"}
                      </span>
                    </span>
                    {!item.complete && item.missing[0] ? (
                      <span className="mt-0.5 block text-xs leading-snug text-muted group-hover:text-ink/70">
                        {item.missing[0]}
                        {item.missing.length > 1 ? ` +${item.missing.length - 1} more` : ""}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {nextIncomplete && !readiness.applicationReady ? (
          <button
            type="button"
            className="mt-3 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-2"
            onClick={() => onJump(nextIncomplete.id)}
          >
            Continue with {TAB_SHORT[nextIncomplete.id]}
          </button>
        ) : null}

        {readiness.messages.length > 0 ? (
          <ul className="mt-4 space-y-2 border-t border-line/80 px-2 pt-4">
            {readiness.messages.slice(0, 3).map((message) => (
              <li key={message} className="flex gap-2 text-xs leading-relaxed text-muted">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/70" aria-hidden />
                <span>{message}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
