/** Best-effort ZAR salary parsing for filter display (not payroll accuracy). */
export function parseSalaryMinZar(text: string | null | undefined): number | null {
  if (!text?.trim()) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();

  const range = lower.match(/(?:r|zar)\s*([\d][\d\s,]*)\s*(?:-|to|–)\s*(?:r|zar)?\s*([\d][\d\s,]*)/i);
  if (range) {
    const min = Number(range[1].replace(/[\s,]/g, ""));
    return Number.isFinite(min) && min > 0 ? min : null;
  }

  const single = lower.match(/(?:r|zar)\s*([\d][\d\s,]*)/i);
  if (single) {
    const value = Number(single[1].replace(/[\s,]/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  return null;
}

export function normalizeEmploymentType(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, " ");
}
