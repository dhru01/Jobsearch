"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LocationSuggestion } from "@/lib/jobs/location-autocomplete";

type LocationSuggestInputProps = {
  name?: string;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
};

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function LocationSuggestInput({
  name,
  defaultValue = "",
  value,
  placeholder = "South Africa",
  className,
  onValueChange,
  onSelectSuggestion,
}: LocationSuggestInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  function setValue(next: string) {
    setInternal(next);
    onValueChange?.(next);
  }
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const query = current.trim();
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, limit: "10" });
        const response = await fetch(`/api/location-suggest?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Suggest failed");
        const payload = (await response.json()) as { suggestions?: LocationSuggestion[] };
        setSuggestions(payload.suggestions ?? []);
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [current, open]);

  function choose(item: LocationSuggestion | string) {
    const next = typeof item === "string" ? item : item.label;
    setValue(next);
    if (typeof item !== "string") onSelectSuggestion?.(item);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = open && (loading || suggestions.length > 0);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <PinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          name={name}
          value={current}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          className={`${className ?? ""} pl-9 pr-9`}
        />
        {current ? (
          <button
            type="button"
            aria-label="Clear location"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-muted hover:bg-panel hover:text-ink"
            onClick={() => {
              setValue("");
              setOpen(true);
            }}
          >
            ×
          </button>
        ) : null}
      </div>
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-bg py-1 shadow-lg"
        >
          {loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Searching places…</li>
          ) : null}
          {suggestions.map((item, index) => (
            <li key={item.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`flex w-full items-start gap-2 px-3 py-2 text-left ${
                  index === activeIndex ? "bg-panel" : "hover:bg-panel"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{item.primary}</span>
                  {item.secondary ? (
                    <span className="block text-xs text-muted">{item.secondary}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
