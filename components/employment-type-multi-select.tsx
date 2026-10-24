"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EMPLOYMENT_TYPE_FILTER_OPTIONS } from "@/lib/jobs/employment-type-options";

const labelByValue = new Map(
  EMPLOYMENT_TYPE_FILTER_OPTIONS.map((option) => [option.value, option.label]),
);

type EmploymentTypeMultiSelectProps = {
  name?: string;
  defaultSelected?: string[];
  className?: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function selectionSummary(selected: Set<string>) {
  if (selected.size === 0) return { text: "Any type", muted: true };
  const labels = [...selected]
    .map((value) => labelByValue.get(value) ?? value)
    .sort((a, b) => a.localeCompare(b));
  return { text: labels.join(", "), muted: false };
}

export function EmploymentTypeMultiSelect({
  name = "employment",
  defaultSelected = [],
  className,
}: EmploymentTypeMultiSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set(defaultSelected));

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function toggle(value: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const summary = selectionSummary(selected);

  return (
    <div ref={rootRef} className="relative">
      {Array.from(selected).map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <button
        type="button"
        className={`${className ?? ""} flex items-center justify-between gap-2 text-left`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`min-w-0 truncate ${summary.muted ? "text-muted" : "text-ink"}`}>
          {summary.text}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-line bg-bg py-1 shadow-lg"
        >
          {EMPLOYMENT_TYPE_FILTER_OPTIONS.map((option) => {
            const checked = selected.has(option.value);
            return (
              <li key={option.value} role="option" aria-selected={checked}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-panel"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => toggle(option.value)}
                >
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-ink bg-ink text-bg" : "border-line bg-bg"
                    }`}
                  >
                    {checked ? (
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2.5 6l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="text-ink">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
