import type { EducationItem } from "@/lib/profile";

export function createEmptyEducation(): EducationItem {
  return {
    institution: "",
    qualification: "",
    field: "",
    start_year: "",
    end_year: "",
    status: "",
    achievements: "",
    certifications: "",
    location: "",
    level: "",
    title: "",
    major: "",
    start_month: "",
    end_month: "",
    currently_studying: false,
    coursework: "",
    grade: "",
  };
}

export function educationEntryFilled(item: EducationItem) {
  return Object.values(item).some((value) => {
    if (typeof value === "boolean") return value;
    return typeof value === "string" && value.trim().length > 0;
  });
}

/** At least one row, plus an empty row at the end when the last row has content. */
export function normalizeEducationForForm(education: EducationItem[]): EducationItem[] {
  let rows = education.length > 0 ? education.slice() : [createEmptyEducation()];

  while (
    rows.length > 1 &&
    !educationEntryFilled(rows[rows.length - 1]) &&
    !educationEntryFilled(rows[rows.length - 2])
  ) {
    rows.pop();
  }

  if (rows.length === 0) rows = [createEmptyEducation()];

  const last = rows[rows.length - 1];
  if (educationEntryFilled(last)) rows = [...rows, createEmptyEducation()];

  return rows;
}
