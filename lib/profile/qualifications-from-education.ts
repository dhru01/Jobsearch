/** Job-matching qualification rows derived from full education entries. */
export function qualificationsFromEducation(
  education: { qualification?: string; level?: string }[],
): { name: string; level: string }[] {
  return education
    .map((item) => ({
      name: (item.qualification ?? "").trim(),
      level: (item.level ?? "").trim(),
    }))
    .filter((item) => item.name || item.level);
}
