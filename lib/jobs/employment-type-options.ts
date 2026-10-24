/** Values are matched loosely against scraped `employment_type` text (see match-filters). */
export const EMPLOYMENT_TYPE_FILTER_OPTIONS = [
  { value: "graduate", label: "Graduate" },
  { value: "internship", label: "Internship" },
  { value: "learnership", label: "Learnership" },
  { value: "full time", label: "Full-time" },
  { value: "part time", label: "Part-time" },
] as const;

const EMPLOYMENT_FILTER_VALUES = new Set<string>(
  EMPLOYMENT_TYPE_FILTER_OPTIONS.map((option) => option.value),
);

/** Normalize employment filter values from form fields or URL params. */
export function parseEmploymentFilters(input: string | string[] | undefined): string[] {
  if (!input) return [];

  const parts = Array.isArray(input) ? input : [input];
  const values: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    for (const piece of part.split(",")) {
      const value = piece.trim().toLowerCase();
      if (!value || !EMPLOYMENT_FILTER_VALUES.has(value) || seen.has(value)) continue;
      seen.add(value);
      values.push(value);
    }
  }

  return values;
}
