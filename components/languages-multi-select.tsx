"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fieldClass } from "@/components/field";
import {
  SPOKEN_LANGUAGE_OPTIONS,
  selectedLanguagesFromList,
} from "@/lib/profile/language-suggestions";

function normalise(value: string) {
  return value.trim().toLowerCase();
}

export function LanguagesMultiSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = selectedLanguagesFromList(value);
  const selectedSet = new Set(selected.map((item) => normalise(item)));

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function toggle(language: string) {
    const key = normalise(language);
    if (selected.some((item) => normalise(item) === key)) {
      onChange(selected.filter((item) => normalise(item) !== key).join(", "));
      return;
    }
    onChange([...selected, language].join(", "));
  }

  const summary =
    selected.length === 0
      ? "Select languages"
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={`${fieldClass} flex w-full items-center justify-between gap-2 text-left`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected.length === 0 ? "text-muted/80" : "text-ink"}>{summary}</span>
        <span className="text-muted" aria-hidden>▾</span>
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-bg py-2 shadow-lg"
        >
          {SPOKEN_LANGUAGE_OPTIONS.map((language) => {
            const checked = selectedSet.has(normalise(language));
            return (
              <label
                key={language}
                role="option"
                aria-selected={checked}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-panel"
              >
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={checked}
                  onChange={() => toggle(language)}
                />
                <span className="text-ink">{language}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
