"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fieldClass } from "@/components/field";
import {
  appendLanguageToList,
  replacePendingLanguageToken,
  searchSpokenLanguages,
  selectedLanguagesFromList,
} from "@/lib/profile/language-suggestions";
import {
  appendSkillToList,
  replacePendingSkillToken,
  searchSkills,
  selectedSkillsFromList,
} from "@/lib/profile/skill-suggestions";

type SkillsSuggestInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Comma-separated list for matching fields; single value for one skill name. */
  mode?: "list" | "single";
  showHint?: boolean;
  /** Skills vs spoken/written human languages. */
  catalog?: "skills" | "languages";
};

export function SkillsSuggestInput({
  id,
  value,
  onChange,
  placeholder = "Search or type a skill",
  className,
  mode = "list",
  showHint = false,
  catalog = "skills",
}: SkillsSuggestInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const pendingQuery =
    mode === "single"
      ? value.trim()
      : (() => {
          const lastComma = value.lastIndexOf(",");
          return value.slice(lastComma + 1).trim();
        })();

  const alreadySelected =
    mode === "list"
      ? catalog === "languages"
        ? selectedLanguagesFromList(value)
        : selectedSkillsFromList(value)
      : value.trim()
        ? [value.trim()]
        : [];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open || !pendingQuery) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const timer = window.setTimeout(() => {
      setSuggestions(
        catalog === "languages"
          ? searchSpokenLanguages(pendingQuery, 12, alreadySelected)
          : searchSkills(pendingQuery, 12, alreadySelected),
      );
      setActiveIndex(-1);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open, pendingQuery, value, mode, catalog]);

  function choose(skill: string) {
    const append = catalog === "languages" ? appendLanguageToList : appendSkillToList;
    const replace = catalog === "languages" ? replacePendingLanguageToken : replacePendingSkillToken;
    if (mode === "single") {
      onChange(skill);
    } else if (!pendingQuery) {
      onChange(append(value, skill));
    } else {
      onChange(replace(value, skill));
    }
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && pendingQuery && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
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
          const next = event.target.value;
          const query =
            mode === "single"
              ? next.trim()
              : next.slice(next.lastIndexOf(",") + 1).trim();
          setOpen(query.length > 0);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (pendingQuery) setOpen(true);
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
          {suggestions.map((skill, index) => (
            <li key={skill} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === activeIndex ? "bg-panel text-ink" : "text-ink hover:bg-panel"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(skill)}
              >
                {skill}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {mode === "list" && showHint ? (
        <p className="mt-1.5 text-xs text-muted">Type to search, pick from the list, or separate skills with commas.</p>
      ) : null}
    </div>
  );
}
