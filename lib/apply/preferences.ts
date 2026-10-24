export type ApplyMode = "manual" | "approval_required" | "automatic";

export type ApplicationPreferences = {
  user_id: string;
  mode: ApplyMode;
  auto_submit_consent_at: string | null;
  paused: boolean;
  min_score: number;
  max_per_day: number;
  preferred_titles: string[];
  preferred_locations: string[];
  min_salary: number | null;
  employment_types: string[];
  excluded_companies: string[];
  excluded_industries: string[];
};

export const defaultApplicationPreferences: Omit<ApplicationPreferences, "user_id"> = {
  mode: "approval_required",
  auto_submit_consent_at: null,
  paused: false,
  min_score: 50,
  max_per_day: 5,
  preferred_titles: [],
  preferred_locations: [],
  min_salary: null,
  employment_types: [],
  excluded_companies: [],
  excluded_industries: [],
};

export function normalizePreferences(row: Record<string, unknown> | null | undefined, userId: string): ApplicationPreferences {
  if (!row) {
    return { user_id: userId, ...defaultApplicationPreferences };
  }
  const mode = row.mode;
  return {
    user_id: userId,
    mode: mode === "manual" || mode === "automatic" || mode === "approval_required" ? mode : "approval_required",
    auto_submit_consent_at: (row.auto_submit_consent_at as string | null) ?? null,
    paused: Boolean(row.paused),
    min_score: Number(row.min_score ?? 50),
    max_per_day: Number(row.max_per_day ?? 5),
    preferred_titles: Array.isArray(row.preferred_titles) ? (row.preferred_titles as string[]) : [],
    preferred_locations: Array.isArray(row.preferred_locations) ? (row.preferred_locations as string[]) : [],
    min_salary: row.min_salary == null ? null : Number(row.min_salary),
    employment_types: Array.isArray(row.employment_types) ? (row.employment_types as string[]) : [],
    excluded_companies: Array.isArray(row.excluded_companies) ? (row.excluded_companies as string[]) : [],
    excluded_industries: Array.isArray(row.excluded_industries) ? (row.excluded_industries as string[]) : [],
  };
}

export function canAutoSubmit(prefs: ApplicationPreferences) {
  return prefs.mode === "automatic" && Boolean(prefs.auto_submit_consent_at) && !prefs.paused;
}
