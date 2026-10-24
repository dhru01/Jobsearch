import { z } from "zod";
import { QUALIFICATION_LEVELS } from "@/lib/matching/score";
import { qualificationsFromEducation } from "@/lib/profile/qualifications-from-education";

const text = (max: number) => z.string().trim().max(max);

const educationSchema = z.object({
  institution: text(160),
  qualification: text(160),
  field: text(160),
  start_year: text(12).optional().default(""),
  end_year: text(12),
  status: text(40).optional().default(""),
  achievements: text(1000).optional().default(""),
  certifications: text(400).optional().default(""),
  location: text(160).optional().default(""),
  level: text(80).optional().default(""),
  title: text(160).optional().default(""),
  major: text(160).optional().default(""),
  start_month: text(20).optional().default(""),
  end_month: text(20).optional().default(""),
  currently_studying: z.boolean().optional().default(false),
  coursework: text(1000).optional().default(""),
  grade: text(80).optional().default(""),
});

const experienceSchema = z.object({
  title: text(160),
  organisation: text(160),
  employment_type: text(40).optional().default(""),
  start: text(40),
  end: text(40),
  summary: text(1000),
  achievements: text(1000).optional().default(""),
  skills_used: text(400).optional().default(""),
  arrangement: text(40).optional().default(""),
  city: text(80).optional().default(""),
  province: text(80).optional().default(""),
  country: text(80).optional().default(""),
  current: z.boolean().optional().default(false),
  responsibilities: text(2000).optional().default(""),
  technologies: text(400).optional().default(""),
  industry: text(80).optional().default(""),
  reason_for_leaving: text(400).optional().default(""),
});

const skillsDetailSchema = z.object({
  technical: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  software: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  languages: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  certifications: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  other: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
});

const qualificationSchema = z.object({
  name: text(160),
  level: z.union([z.enum(QUALIFICATION_LEVELS), z.literal("")]),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(120),
  first_name: z.string().trim().min(1, "Enter your first name.").max(80),
  last_name: z.string().trim().min(1, "Enter your last name.").max(80),
  preferred_name: text(80).optional().default(""),
  email: z.string().trim().email("Enter a valid email.").max(200),
  phone: text(40),
  location: text(120),
  country: text(8).optional().default("ZA"),
  province: text(80).optional().default(""),
  city: text(80).optional().default(""),
  address: text(240).optional().default(""),
  nationality: z.string().trim().min(1, "Enter your nationality.").max(80),
  work_authorisation: text(80).optional().default(""),
  availability_date: text(20).optional().default(""),
  notice_period: text(80).optional().default(""),
  headline: text(160),
  summary: text(4000),
  skills: z.array(z.string().trim().min(1).max(60)).max(50),
  skills_detail: skillsDetailSchema.optional(),
  years_experience: z
    .number({ invalid_type_error: "Enter years of experience as a number." })
    .min(0, "Years of experience cannot be negative.")
    .max(60, "Years of experience looks too high.")
    .nullable(),
  education: z.array(educationSchema).max(20),
  experience: z.array(experienceSchema).max(30),
  qualifications: z.array(qualificationSchema).max(20),
  preferences: z.object({
    roles: z.array(z.string().trim().min(1).max(80)).max(20),
    locations: z.array(z.string().trim().min(1).max(80)).max(20),
    work_modes: z.array(z.enum(["remote", "hybrid", "on_site"])).max(3),
    open_to_relocate: z.boolean(),
    digest_email: z.boolean(),
    industries: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
    employment_types: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
    seniority: text(40).optional().default(""),
    min_salary: z.number().min(0).max(10_000_000).nullable().optional().default(null),
    excluded_companies: z.array(z.string().trim().min(1).max(80)).max(50).optional().default([]),
    excluded_industries: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  }),
  accuracy_confirmed: z.boolean().optional().default(false),
  profile_extended: z.record(z.unknown()).optional().default({}),
}).superRefine((data, ctx) => {
  const extended = data.profile_extended ?? {};
  const dateOfBirth =
    typeof extended.date_of_birth === "string" ? extended.date_of_birth.trim() : "";
  if (!dateOfBirth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter your date of birth.",
      path: ["profile_extended", "date_of_birth"],
    });
  }
  const race = typeof extended.race === "string" ? extended.race.trim() : "";
  if (!race) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select your race.",
      path: ["profile_extended", "race"],
    });
  }
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters.").max(72),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required before we can store your CV." }),
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

function filled(row: Record<string, unknown>) {
  return Object.values(row).some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "boolean") return value;
    return false;
  });
}

export function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function profileToRow(input: ProfileInput) {
  const location =
    emptyToNull(input.city) && emptyToNull(input.province)
      ? `${input.city.trim()}, ${input.province.trim()}`
      : emptyToNull(input.location) || emptyToNull(input.city);
  return {
    full_name: input.full_name,
    first_name: emptyToNull(input.first_name ?? ""),
    last_name: emptyToNull(input.last_name ?? ""),
    preferred_name: emptyToNull(input.preferred_name ?? ""),
    email: input.email,
    phone: emptyToNull(input.phone),
    location,
    country: emptyToNull(input.country ?? "") ?? "ZA",
    province: emptyToNull(input.province ?? ""),
    city: emptyToNull(input.city ?? ""),
    address: emptyToNull(input.address ?? ""),
    nationality: emptyToNull(input.nationality ?? ""),
    work_authorisation: emptyToNull(input.work_authorisation ?? ""),
    availability_date: emptyToNull(input.availability_date ?? ""),
    notice_period: emptyToNull(input.notice_period ?? ""),
    headline: emptyToNull(input.headline),
    summary: emptyToNull(input.summary),
    skills: input.skills,
    skills_detail: input.skills_detail ?? {
      technical: [],
      software: [],
      languages: [],
      certifications: [],
      other: [],
    },
    years_experience: input.years_experience,
    education: input.education.filter(filled),
    experience: input.experience.filter(filled),
    qualifications: qualificationsFromEducation(input.education),
    preferences: input.preferences,
    extraction_status: "confirmed" as const,
    profile_extended: input.profile_extended ?? {},
  };
}
