"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SEARCH_STEPS = [
  {
    title: "Searching job boards",
    detail: "Searching live job listings. This can take up to a minute.",
  },
  {
    title: "Applying your filters",
    detail: "Using your job title, location, and employment types.",
  },
  {
    title: "Saving listings",
    detail: "Removing duplicates and keeping roles relevant to South Africa.",
  },
  {
    title: "Matching your profile",
    detail: "Comparing each role with your confirmed CV and preferences.",
  },
  {
    title: "Rating fit",
    detail: "Scoring qualifications, skills, experience, location, and preferences.",
  },
  {
    title: "Building your shortlist",
    detail: "Ranking matches and checking eligibility.",
  },
] as const;

const STEP_MS = 9_000;

export function JobSearchProgress({ active }: { active: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStepIndex((index) => Math.min(index + 1, SEARCH_STEPS.length - 1));
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  if (!active || !mounted) return null;

  const current = SEARCH_STEPS[stepIndex];
  const progress = ((stepIndex + 1) / SEARCH_STEPS.length) * 100;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-search-progress-title"
      aria-describedby="job-search-progress-detail"
    >
      <div className="w-full max-w-lg rounded-[1.75rem] border border-line bg-raised p-8 shadow-xl sm:p-10">
        <p className="text-sm font-medium text-accent">Matches</p>
        <h2 id="job-search-progress-title" className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Working on your shortlist
        </h2>
        <p id="job-search-progress-detail" className="mt-4 text-sm leading-6 text-muted">
          {current.detail}
        </p>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-ink">{current.title}</span>
            <span className="text-muted" aria-hidden>
              {stepIndex + 1} / {SEARCH_STEPS.length}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ol className="mt-8 space-y-3" aria-label="Search progress">
          {SEARCH_STEPS.map((step, index) => {
            const status =
              index < stepIndex ? "done" : index === stepIndex ? "current" : "upcoming";
            return (
              <li
                key={step.title}
                className={`flex items-start gap-3 text-sm ${
                  status === "upcoming" ? "text-muted" : "text-ink"
                }`}
                aria-current={status === "current" ? "step" : undefined}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    status === "done"
                      ? "bg-good-bg text-good"
                      : status === "current"
                        ? "bg-accent text-white"
                        : "border border-line bg-bg text-muted"
                  }`}
                  aria-hidden
                >
                  {status === "done" ? "✓" : index + 1}
                </span>
                <span>
                  <span className={status === "current" ? "font-medium" : undefined}>{step.title}</span>
                  {status === "current" ? (
                    <span className="mt-0.5 block text-xs text-muted">{step.detail}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-xs text-muted" role="status">
          Please keep this tab open until your results load.
        </p>
      </div>
    </div>,
    document.body,
  );
}
