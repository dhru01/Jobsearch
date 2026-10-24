import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreJob, type ScoreJob, type ScoreProfile } from "@/lib/matching/score";
import { emptyExtended, normalizeExtended, skillsFromLegacy, type ProfileExtended } from "@/lib/profile/extended";
import { createEmptyEducation, normalizeEducationForForm } from "@/lib/profile/education-form";
import { qualificationsFromEducation } from "@/lib/profile/qualifications-from-education";
import { noticePeriodSelectValue } from "@/lib/profile/constants";
import type { ProfileInput } from "@/lib/validation/profile";

export type EducationItem = {
  institution: string;
  qualification: string;
  field: string;
  start_year: string;
  end_year: string;
  status: string;
  achievements: string;
  certifications: string;
  location: string;
  level: string;
  title: string;
  major: string;
  start_month: string;
  end_month: string;
  currently_studying: boolean;
  coursework: string;
  grade: string;
};

export type ExperienceItem = {
  title: string;
  organisation: string;
  employment_type: string;
  start: string;
  end: string;
  summary: string;
  achievements: string;
  skills_used: string;
  arrangement: string;
  city: string;
  province: string;
  country: string;
  current: boolean;
  responsibilities: string;
  technologies: string;
  industry: string;
  reason_for_leaving: string;
};

export type SkillsDetail = {
  technical: string[];
  software: string[];
  languages: string[];
  certifications: string[];
  other: string[];
};

export type QualificationItem = {
  name: string;
  level: string;
};

export type ProfilePreferences = {
  roles: string[];
  locations: string[];
  work_modes: Array<"remote" | "hybrid" | "on_site">;
  open_to_relocate: boolean;
  digest_email: boolean;
  industries: string[];
  employment_types: string[];
  seniority: string;
  min_salary: number | null;
  excluded_companies: string[];
  excluded_industries: string[];
};

export type CandidateProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  nationality: string | null;
  work_authorisation: string | null;
  availability_date: string | null;
  notice_period: string | null;
  headline: string | null;
  summary: string | null;
  skills: string[];
  skills_detail: SkillsDetail;
  education: EducationItem[];
  experience: ExperienceItem[];
  qualifications: QualificationItem[];
  preferences: ProfilePreferences;
  years_experience: number | null;
  extraction_status: "pending_confirmation" | "confirmed";
  confirmed_at: string | null;
  accuracy_confirmed_at: string | null;
  extended: ProfileExtended;
};

export type ProfileDraft = {
  full_name: string;
  first_name: string;
  last_name: string;
  preferred_name: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  province: string;
  city: string;
  address: string;
  nationality: string;
  work_authorisation: string;
  availability_date: string;
  notice_period: string;
  headline: string;
  summary: string;
  skills: string;
  technical_skills: string;
  software: string;
  languages: string;
  certifications: string;
  other_skills: string;
  years_experience: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  qualifications: QualificationItem[];
  roles: string;
  locations: string;
  work_modes: string[];
  open_to_relocate: boolean;
  digest_email: boolean;
  industries: string;
  employment_types: string;
  seniority: string;
  min_salary: string;
  excluded_companies: string;
  excluded_industries: string;
  accuracy_confirmed: boolean;
  extended: ProfileExtended;
};

type JobRow = {
  id: string;
  title: string;
  city: string | null;
  province: string | null;
  location: string | null;
  work_mode: string;
  min_qualification: string | null;
  min_years_experience: number | string | null;
  skills: string[] | null;
};

const emptyPreferences: ProfilePreferences = {
  roles: [],
  locations: [],
  work_modes: [],
  open_to_relocate: false,
  digest_email: false,
  industries: [],
  employment_types: [],
  seniority: "",
  min_salary: null,
  excluded_companies: [],
  excluded_industries: [],
};

const emptySkillsDetail: SkillsDetail = {
  technical: [],
  software: [],
  languages: [],
  certifications: [],
  other: [],
};

function emptyEducation(): EducationItem {
  return createEmptyEducation();
}

export { createEmptyEducation, normalizeEducationForForm } from "@/lib/profile/education-form";

function emptyExperience(): ExperienceItem {
  return {
    title: "",
    organisation: "",
    employment_type: "",
    start: "",
    end: "",
    summary: "",
    achievements: "",
    skills_used: "",
    arrangement: "",
    city: "",
    province: "",
    country: "South Africa",
    current: false,
    responsibilities: "",
    technologies: "",
    industry: "",
    reason_for_leaving: "",
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asSkillsDetail(value: unknown): SkillsDetail {
  const raw = (value ?? {}) as Partial<SkillsDetail>;
  return {
    technical: asArray<string>(raw.technical).filter((item) => typeof item === "string"),
    software: asArray<string>(raw.software).filter((item) => typeof item === "string"),
    languages: asArray<string>(raw.languages).filter((item) => typeof item === "string"),
    certifications: asArray<string>(raw.certifications).filter((item) => typeof item === "string"),
    other: asArray<string>(raw.other).filter((item) => typeof item === "string"),
  };
}

export function normalizeProfile(row: Record<string, unknown>): CandidateProfile {
  const preferences = (row.preferences ?? {}) as Partial<ProfilePreferences>;
  const years = row.years_experience;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    full_name: (row.full_name as string | null) ?? null,
    first_name: (row.first_name as string | null) ?? null,
    last_name: (row.last_name as string | null) ?? null,
    preferred_name: (row.preferred_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    country: (row.country as string | null) ?? "ZA",
    province: (row.province as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    nationality: (row.nationality as string | null) ?? null,
    work_authorisation: (row.work_authorisation as string | null) ?? null,
    availability_date: (row.availability_date as string | null) ?? null,
    notice_period: (row.notice_period as string | null) ?? null,
    headline: (row.headline as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    skills: asArray<string>(row.skills).filter((skill) => typeof skill === "string"),
    skills_detail: asSkillsDetail(row.skills_detail),
    education: asArray<Record<string, unknown>>(row.education).map((item) => ({
      institution: asString(item.institution),
      qualification: asString(item.qualification),
      field: asString(item.field),
      start_year: asString(item.start_year),
      end_year: asString(item.end_year),
      status: asString(item.status),
      achievements: asString(item.achievements),
      certifications: asString(item.certifications),
      location: asString(item.location),
      level: asString(item.level),
      title: asString(item.title),
      major: asString(item.major),
      start_month: asString(item.start_month),
      end_month: asString(item.end_month),
      currently_studying: Boolean(item.currently_studying),
      coursework: asString(item.coursework),
      grade: asString(item.grade),
    })),
    experience: asArray<Record<string, unknown>>(row.experience).map((item) => ({
      title: asString(item.title),
      organisation: asString(item.organisation),
      employment_type: asString(item.employment_type),
      start: asString(item.start),
      end: asString(item.end),
      summary: asString(item.summary),
      achievements: asString(item.achievements),
      skills_used: asString(item.skills_used),
      arrangement: asString(item.arrangement),
      city: asString(item.city),
      province: asString(item.province),
      country: asString(item.country),
      current: Boolean(item.current),
      responsibilities: asString(item.responsibilities),
      technologies: asString(item.technologies),
      industry: asString(item.industry),
      reason_for_leaving: asString(item.reason_for_leaving),
    })),
    qualifications: asArray<Record<string, unknown>>(row.qualifications).map((item) => ({
      name: asString(item.name),
      level: asString(item.level),
    })),
    preferences: {
      roles: asArray<string>(preferences.roles).filter((role) => typeof role === "string"),
      locations: asArray<string>(preferences.locations).filter((location) => typeof location === "string"),
      work_modes: asArray<"remote" | "hybrid" | "on_site">(preferences.work_modes).filter((mode) =>
        mode === "remote" || mode === "hybrid" || mode === "on_site",
      ),
      open_to_relocate: Boolean(preferences.open_to_relocate),
      digest_email: Boolean(preferences.digest_email),
      industries: asArray<string>(preferences.industries).filter((item) => typeof item === "string"),
      employment_types: asArray<string>(preferences.employment_types).filter((item) => typeof item === "string"),
      seniority: typeof preferences.seniority === "string" ? preferences.seniority : "",
      min_salary:
        preferences.min_salary == null || preferences.min_salary === ("" as unknown)
          ? null
          : Number(preferences.min_salary),
      excluded_companies: asArray<string>(preferences.excluded_companies).filter((item) => typeof item === "string"),
      excluded_industries: asArray<string>(preferences.excluded_industries).filter((item) => typeof item === "string"),
    },
    years_experience: years == null || years === "" ? null : Number(years),
    extraction_status: row.extraction_status === "confirmed" ? "confirmed" : "pending_confirmation",
    confirmed_at: (row.confirmed_at as string | null) ?? null,
    accuracy_confirmed_at: (row.accuracy_confirmed_at as string | null) ?? null,
    extended: mergeExtendedColumns(row),
  };
}

function mergeExtendedColumns(row: Record<string, unknown>): ProfileExtended {
  const extended = normalizeExtended(row.profile_extended);
  return {
    ...extended,
    middle_name: extended.middle_name || asString(row.middle_name),
    alt_phone: extended.alt_phone || asString(row.alt_phone),
    postal_code: extended.postal_code || asString(row.postal_code),
    location_geoname_id: extended.location_geoname_id || asString(row.location_geoname_id),
    location_lat:
      extended.location_lat || (row.location_lat == null || row.location_lat === "" ? "" : String(row.location_lat)),
    location_lng:
      extended.location_lng || (row.location_lng == null || row.location_lng === "" ? "" : String(row.location_lng)),
  };
}

export function draftFromProfile(profile: CandidateProfile, emailFallback: string): ProfileDraft {
  const preferences = profile.preferences ?? emptyPreferences;
  const detail = profile.skills_detail ?? emptySkillsDetail;
  return {
    full_name: profile.full_name ?? "",
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    preferred_name: profile.preferred_name ?? "",
    email: profile.email ?? emailFallback,
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    country: profile.country ?? "ZA",
    province: profile.province ?? "",
    city: profile.city ?? "",
    address: profile.address ?? "",
    nationality: profile.nationality ?? "",
    work_authorisation: profile.work_authorisation ?? "",
    availability_date: profile.availability_date ?? "",
    notice_period: noticePeriodSelectValue(profile.notice_period ?? ""),
    headline: profile.headline ?? "",
    summary: profile.summary ?? "",
    skills: profile.skills.join(", "),
    technical_skills: detail.technical.join(", "),
    software: detail.software.join(", "),
    languages: detail.languages.join(", "),
    certifications: detail.certifications.join(", "),
    other_skills: detail.other.join(", "),
    years_experience: profile.years_experience == null ? "" : String(profile.years_experience),
    education: normalizeEducationForForm(profile.education),
    experience: profile.experience.length ? profile.experience : [emptyExperience()],
    qualifications: [],
    roles: preferences.roles.join(", "),
    locations: preferences.locations.join(", "),
    work_modes: preferences.work_modes,
    open_to_relocate: preferences.open_to_relocate,
    digest_email: preferences.digest_email,
    industries: preferences.industries.join(", "),
    employment_types: preferences.employment_types.join(", "),
    seniority: preferences.seniority,
    min_salary: preferences.min_salary == null ? "" : String(preferences.min_salary),
    excluded_companies: preferences.excluded_companies.join(", "),
    excluded_industries: preferences.excluded_industries.join(", "),
    accuracy_confirmed: Boolean(profile.accuracy_confirmed_at),
    extended: hydrateExtendedSkills(profile),
  };
}

function hydrateExtendedSkills(profile: CandidateProfile): ProfileExtended {
  const extended = profile.extended ?? emptyExtended();
  if (extended.structured_skills.length > 0) return extended;
  return {
    ...extended,
    structured_skills: [
      ...skillsFromLegacy(profile.skills, "general"),
      ...skillsFromLegacy(profile.skills_detail.technical, "technical"),
      ...skillsFromLegacy(profile.skills_detail.software, "software"),
      ...skillsFromLegacy(profile.skills_detail.languages, "languages"),
      ...skillsFromLegacy(profile.skills_detail.other, "other"),
    ],
  };
}

export function withDemoProfile(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    phone: "082 555 0142",
    location: "Cape Town",
    headline: "Graduate software developer",
    summary:
      "Recent computer science graduate looking for a first developer role. Coursework and a campus tutoring post covered JavaScript, React, and Git.",
    skills: "JavaScript, React, Git, HTML",
    years_experience: "0",
    first_name: draft.first_name || draft.full_name.split(" ")[0] || "Thabo",
    last_name: draft.last_name || draft.full_name.split(" ").slice(1).join(" ") || "Ndlovu",
    country: "ZA",
    city: "Cape Town",
    province: "Western Cape",
    nationality: "South African",
    work_authorisation: "Citizen",
    notice_period: "No notice period",
    technical_skills: "JavaScript, React, Git, HTML",
    software: "VS Code, GitHub",
    languages: "English, Afrikaans",
    education: [
      {
        institution: "University of Cape Town",
        qualification: "BSc Computer Science",
        field: "Computer Science",
        start_year: "2022",
        end_year: "2025",
        status: "completed",
        achievements: "",
        certifications: "",
        location: "Cape Town",
        level: "bachelors",
        title: "",
        major: "Computer Science",
        start_month: "",
        end_month: "",
        currently_studying: false,
        coursework: "",
        grade: "",
      },
    ],
    experience: [
      {
        title: "Campus tutor",
        organisation: "University of Cape Town",
        employment_type: "Part-time",
        start: "2024",
        end: "2025",
        summary: "Helped first-year students with programming practicals.",
        achievements: "",
        skills_used: "JavaScript, React",
        arrangement: "On-site",
        city: "Cape Town",
        province: "Western Cape",
        country: "South Africa",
        current: false,
        responsibilities: "",
        technologies: "",
        industry: "Education",
        reason_for_leaving: "",
      },
    ],
    qualifications: [{ name: "BSc Computer Science", level: "bachelors" }],
    roles: "developer",
    locations: "Cape Town",
    work_modes: ["hybrid"],
    open_to_relocate: false,
    extended: {
      ...draft.extended,
      date_of_birth: draft.extended.date_of_birth || "2000-03-15",
    },
  };
}

export function applyExtraction(
  draft: ProfileDraft,
  extracted: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    headline: string | null;
    summary: string | null;
    skills: string[];
    education: { institution: string | null; qualification: string | null; field: string | null; end_year: string | null }[];
    experience: { title: string | null; organisation: string | null; start: string | null; end: string | null; summary: string | null }[];
    qualifications: { name: string | null; level: string | null }[];
    years_experience: number | null;
    preferences: {
      roles: string[];
      locations: string[];
      work_modes: Array<"remote" | "hybrid" | "on_site">;
      open_to_relocate: boolean | null;
    };
  },
): ProfileDraft {
  return {
    ...draft,
    full_name: extracted.full_name ?? draft.full_name,
    email: extracted.email ?? draft.email,
    phone: extracted.phone ?? draft.phone,
    location: extracted.location ?? draft.location,
    headline: extracted.headline ?? draft.headline,
    summary: extracted.summary ?? draft.summary,
    skills: extracted.skills.length ? extracted.skills.join(", ") : draft.skills,
    years_experience:
      extracted.years_experience == null ? draft.years_experience : String(extracted.years_experience),
    education: extracted.education.length
      ? extracted.education.map((item) => ({
          ...emptyEducation(),
          institution: item.institution ?? "",
          qualification: item.qualification ?? "",
          field: item.field ?? "",
          end_year: item.end_year ?? "",
        }))
      : draft.education,
    experience: extracted.experience.length
      ? extracted.experience.map((item) => ({
          ...emptyExperience(),
          title: item.title ?? "",
          organisation: item.organisation ?? "",
          start: item.start ?? "",
          end: item.end ?? "",
          summary: item.summary ?? "",
        }))
      : draft.experience,
    qualifications: extracted.qualifications.length
      ? extracted.qualifications.map((item) => ({
          name: item.name ?? "",
          level: item.level ?? "",
        }))
      : draft.qualifications,
    roles: extracted.preferences.roles.length ? extracted.preferences.roles.join(", ") : draft.roles,
    locations: extracted.preferences.locations.length
      ? extracted.preferences.locations.join(", ")
      : draft.locations,
    work_modes: extracted.preferences.work_modes.length ? extracted.preferences.work_modes : draft.work_modes,
    open_to_relocate: extracted.preferences.open_to_relocate ?? draft.open_to_relocate,
  };
}

export function toScoreProfile(input: ProfileInput): ScoreProfile {
  const extended = normalizeExtended(input.profile_extended);
  const extraSkills = extended.structured_skills.map((item) => item.name.trim()).filter(Boolean);
  return {
    location: input.location || input.city || null,
    skills: [...new Set([...input.skills, ...extraSkills])],
    yearsExperience: input.years_experience,
    qualifications: qualificationsFromEducation(input.education).map((item) => ({
      level: item.level || null,
      name: item.name || null,
    })),
    education: input.education.map((item) => ({
      qualification: item.qualification || null,
      level: item.level || null,
    })),
    preferences: {
      roles: input.preferences.roles,
      locations: input.preferences.locations,
      workModes: input.preferences.work_modes,
      openToRelocate: input.preferences.open_to_relocate,
    },
  };
}

export function candidateProfileToInput(profile: CandidateProfile): ProfileInput {
  const preferences = profile.preferences ?? emptyPreferences;
  return {
    full_name: profile.full_name ?? "Candidate",
    email: profile.email ?? "candidate@example.com",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    headline: profile.headline ?? "",
    summary: profile.summary ?? "",
    skills: profile.skills,
    years_experience: profile.years_experience,
    education: profile.education,
    experience: profile.experience,
    qualifications: profile.qualifications.map((item) => ({
      name: item.name,
      level: (item.level || "") as ProfileInput["qualifications"][number]["level"],
    })),
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    preferred_name: profile.preferred_name ?? "",
    country: profile.country ?? "ZA",
    province: profile.province ?? "",
    city: profile.city ?? "",
    address: profile.address ?? "",
    nationality: profile.nationality ?? "",
    work_authorisation: profile.work_authorisation ?? "",
    availability_date: profile.availability_date ?? "",
    notice_period: noticePeriodSelectValue(profile.notice_period ?? ""),
    skills_detail: profile.skills_detail,
    accuracy_confirmed: Boolean(profile.accuracy_confirmed_at),
    profile_extended: profile.extended,
    preferences: {
      roles: preferences.roles,
      locations: preferences.locations,
      work_modes: preferences.work_modes,
      open_to_relocate: preferences.open_to_relocate,
      digest_email: preferences.digest_email,
      industries: preferences.industries,
      employment_types: preferences.employment_types,
      seniority: preferences.seniority,
      min_salary: preferences.min_salary,
      excluded_companies: preferences.excluded_companies,
      excluded_industries: preferences.excluded_industries,
    },
  };
}

export function profileCompleteness(profile: CandidateProfile) {
  const items: { label: string; ok: boolean }[] = [
    { label: "Full name", ok: Boolean(profile.full_name) },
    { label: "Phone", ok: Boolean(profile.phone) },
    { label: "City or location", ok: Boolean(profile.city || profile.location) },
    { label: "Work authorisation", ok: Boolean(profile.work_authorisation) },
    { label: "Headline", ok: Boolean(profile.headline) },
    { label: "Summary", ok: Boolean(profile.summary) },
    { label: "Skills", ok: profile.skills.length > 0 },
    { label: "Education", ok: profile.education.length > 0 },
    { label: "Experience", ok: profile.experience.length > 0 },
    {
      label: "Qualifications",
      ok: profile.education.some((item) => item.qualification.trim() && item.level.trim()),
    },
    { label: "Years of experience", ok: profile.years_experience != null },
    { label: "Preferred roles", ok: profile.preferences.roles.length > 0 },
    { label: "Work mode", ok: profile.preferences.work_modes.length > 0 },
  ];
  const filled = items.filter((item) => item.ok).length;
  return {
    percent: Math.round((filled / items.length) * 100),
    missing: items.filter((item) => !item.ok).map((item) => item.label),
  };
}

export async function rescoreMatches(
  supabase: SupabaseClient,
  userId: string,
  input: ProfileInput,
) {
  const { data: jobs, error } = await supabase.from("jobs").select("*");
  if (error) throw error;

  const profile = toScoreProfile(input);
  const rows = ((jobs ?? []) as JobRow[]).map((job) => {
    const scored = scoreJob(profile, toScoreJob(job));
    return {
      user_id: userId,
      job_id: job.id,
      score: scored.score,
      breakdown: scored.breakdown,
      eligibility_pass: scored.eligibilityPass,
      eligibility_reasons: scored.eligibilityReasons,
    };
  });

  if (rows.length === 0) return;

  const { error: upsertError } = await supabase.from("matches").upsert(rows, {
    onConflict: "user_id,job_id",
  });
  if (upsertError) throw upsertError;
}

function toScoreJob(job: JobRow): ScoreJob {
  return {
    title: job.title,
    city: job.city,
    province: job.province,
    location: job.location,
    workMode: job.work_mode,
    minQualification: job.min_qualification,
    minYearsExperience:
      job.min_years_experience == null ? null : Number(job.min_years_experience),
    skills: job.skills ?? [],
  };
}
