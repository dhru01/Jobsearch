"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { fieldClass } from "@/components/field";
import { searchDegrees } from "@/lib/profile/degree-suggestions";

export function DegreeSuggestInput({
  id,
  value,
  onChange,
  level,
  placeholder = "Start typing a qualification",
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  level?: string;
  placeholder?: string;
  className?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const query = value.trim();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open || !query) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const timer = window.setTimeout(() => {
      setSuggestions(searchDegrees(query, level ?? "", 12));
      setActiveIndex(-1);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open, query, level]);

  function choose(degree: string) {
    onChange(degree);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && query && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
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

  const showList = open && suggestions.length > 0;
  const inputClass = className ?? fieldClass;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(event.target.value.trim().length > 0);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (query) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        className={inputClass}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-bg py-1 shadow-lg"
        >
          {suggestions.map((degree, index) => (
            <li key={degree} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === activeIndex ? "bg-panel text-ink" : "text-ink hover:bg-panel"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(degree)}
              >
                {degree}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
