export const SA_QUALIFICATION_OPTIONS = [
  { value: "matric", label: "National Senior Certificate" },
  { value: "certificate", label: "Higher Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "diploma", label: "Advanced Diploma", key: "advanced_diploma" },
  { value: "bachelors", label: "Bachelor’s Degree" },
  { value: "honours", label: "Honours Degree" },
  { value: "honours", label: "Postgraduate Diploma", key: "pgdip" },
  { value: "masters", label: "Master’s Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "", label: "Other / international" },
] as const;

export const CAREER_LEVELS = [
  "Student",
  "Graduate",
  "Internship",
  "Junior",
  "Mid-level",
  "Senior",
  "Manager",
  "Executive",
] as const;

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Graduate programme",
  "Temporary",
  "Freelance",
  "Self-employed",
  "Volunteer",
  "Vacation work",
  "University project",
  "Other",
] as const;

export const WORK_ARRANGEMENTS = ["On-site", "Hybrid", "Remote"] as const;

export const NOTICE_PERIOD_OPTIONS = [
  "No notice period",
  "1 month",
  "6 months",
  "1 year",
] as const;

const LEGACY_NOTICE_PERIOD: Record<string, string> = {
  Immediate: "No notice period",
  Immediately: "No notice period",
};

export function noticePeriodSelectValue(stored: string) {
  const trimmed = stored.trim();
  if (!trimmed) return "";
  return LEGACY_NOTICE_PERIOD[trimmed] ?? trimmed;
}

/** Common experience bands used on job applications and boards. */
export const YEARS_EXPERIENCE_RANGE_OPTIONS = [
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "6–10 years",
  "11–15 years",
  "More than 15 years",
] as const;

type YearsExperienceRange = (typeof YEARS_EXPERIENCE_RANGE_OPTIONS)[number];

const YEARS_RANGE_TO_PROFILE_NUMBER: Record<YearsExperienceRange, string> = {
  "Less than 1 year": "0",
  "1–2 years": "2",
  "3–5 years": "4",
  "6–10 years": "8",
  "11–15 years": "13",
  "More than 15 years": "16",
};

export function yearsExperienceRangeSelectValue(stored: string, numericYears = "") {
  const trimmed = stored.trim();
  const options: readonly string[] = YEARS_EXPERIENCE_RANGE_OPTIONS;
  if (trimmed && options.includes(trimmed)) return trimmed;
  const normalized = trimmed.replace(/-/g, "–");
  if (normalized && options.includes(normalized)) return normalized;

  const n = Number(numericYears.trim());
  if (!Number.isFinite(n) || numericYears.trim() === "") {
    return options.includes(trimmed) ? trimmed : "";
  }
  if (n < 1) return "Less than 1 year";
  if (n <= 2) return "1–2 years";
  if (n <= 5) return "3–5 years";
  if (n <= 10) return "6–10 years";
  if (n <= 15) return "11–15 years";
  return "More than 15 years";
}

export function profileYearsFromExperienceRange(range: string) {
  if (!range) return "";
  return YEARS_RANGE_TO_PROFILE_NUMBER[range as YearsExperienceRange] ?? "";
}

export const EDUCATION_STATUSES = ["Completed", "In progress", "Incomplete"] as const;

export const LANGUAGE_PROFICIENCY = ["Basic", "Conversational", "Professional", "Fluent", "Native"] as const;

export const YES_NO_UNSURE = [
  { value: "", label: "Not specified" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
] as const;

export const WORK_AUTHORISATION_OPTIONS = [
  "South African citizen",
  "Permanent resident",
  "Work visa / permit",
  "Study visa (limited work)",
  "Asylum / refugee documentation",
  "Not authorised",
  "Unsure",
] as const;

export const YES_NO_APPLICATION_ANSWERS = [
  { value: "", label: "Select an answer" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

/** Maps saved free-text answers onto yes/no select values when possible. */
export function yesNoApplicationAnswerValue(stored: string) {
  const trimmed = stored.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower === "yes" || lower === "y") return "yes";
  if (lower === "no" || lower === "n") return "no";
  if (/^yes\b/i.test(trimmed)) return "yes";
  if (/^no\b/i.test(trimmed)) return "no";
  return "";
}

export const STANDARD_APPLICATION_QUESTIONS = [
  {
    id: "authorised_to_work",
    category: "Work eligibility",
    question: "Are you legally authorised to work in the country?",
    answerType: "yes_no",
  },
  {
    id: "requires_sponsorship",
    category: "Work eligibility",
    question: "Do you require visa sponsorship?",
    answerType: "yes_no",
  },
  {
    id: "valid_work_permit",
    category: "Work eligibility",
    question: "Do you have a valid work permit?",
    answerType: "yes_no",
  },
  {
    id: "currently_employed",
    category: "Employment",
    question: "Are you currently employed?",
    answerType: "yes_no",
  },
  {
    id: "notice_period",
    category: "Employment",
    question: "What is your notice period?",
    answerType: "notice_period",
  },
  {
    id: "current_salary",
    category: "Employment",
    question: "What is your current annual salary?",
    answerType: "text",
  },
  {
    id: "willing_relocate",
    category: "Employment",
    question: "Are you willing to relocate?",
    answerType: "yes_no",
  },
  {
    id: "willing_travel",
    category: "Employment",
    question: "Are you willing to travel?",
    answerType: "yes_no",
  },
  {
    id: "highest_qualification",
    category: "Qualifications",
    question: "What is your highest completed qualification?",
    answerType: "text",
  },
  {
    id: "certifications",
    category: "Qualifications",
    question: "Which relevant professional certifications do you hold?",
    answerType: "long_text",
  },
  {
    id: "years_experience",
    category: "Experience",
    question: "How many years of professional experience do you have?",
    answerType: "years_experience_range",
  },
  {
    id: "industry_experience",
    category: "Experience",
    question: "What relevant industry experience do you have?",
    answerType: "long_text",
  },
  {
    id: "management_experience",
    category: "Experience",
    question: "What management experience do you have?",
    answerType: "long_text",
  },
  {
    id: "technology_experience",
    category: "Experience",
    question: "Which technologies have you used professionally?",
    answerType: "long_text",
  },
  {
    id: "drivers_licence",
    category: "Other",
    question: "Do you have a valid driver’s licence?",
    answerType: "yes_no",
  },
  {
    id: "reliable_transport",
    category: "Other",
    question: "Do you have access to reliable transport?",
    answerType: "yes_no",
  },
  {
    id: "work_shifts",
    category: "Other",
    question: "Are you willing to work shifts?",
    answerType: "yes_no",
  },
  {
    id: "work_weekends",
    category: "Other",
    question: "Are you willing to work weekends?",
    answerType: "yes_no",
  },
  {
    id: "background_checks",
    category: "Other",
    question: "Are you willing to undergo job-relevant background checks?",
    answerType: "yes_no",
  },
  {
    id: "assessments",
    category: "Other",
    question: "Are you willing to complete assessments?",
    answerType: "yes_no",
  },
  {
    id: "interview_availability",
    category: "Other",
    question: "Are you available for interviews?",
    answerType: "yes_no",
  },
] as const;

export const MOTIVATION_QUESTIONS = [
  { id: "about_yourself", question: "Tell us about yourself." },
  { id: "why_new_opportunity", question: "Why are you looking for a new opportunity?" },
  { id: "greatest_strengths", question: "What are your greatest strengths?" },
  { id: "development_areas", question: "What are your development areas?" },
  { id: "professional_achievement", question: "Describe a professional achievement." },
  { id: "challenge_overcame", question: "Describe a challenge you overcame." },
  { id: "leadership_experience", question: "Describe your leadership experience." },
  { id: "teamwork_experience", question: "Describe your teamwork experience." },
  { id: "solved_a_problem", question: "Describe a time you solved a problem." },
] as const;

/** Population groups used on South African employment and equity forms. */
export const RACE_OPTIONS = [
  "African",
  "Coloured",
  "Indian / Asian",
  "White",
  "Other",
] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

/** Citizenship / nationality options common on South African applications. */
export const NATIONALITY_OTHER = "Other";

export const NATIONALITY_OPTIONS = [
  "South African",
  "Angolan",
  "Basotho",
  "Botswanan",
  "Burundian",
  "Congolese (DRC)",
  "Ethiopian",
  "Ghanaian",
  "Kenyan",
  "Malawian",
  "Mozambican",
  "Namibian",
  "Nigerian",
  "Rwandan",
  "Somali",
  "Sudanese",
  "Tanzanian",
  "Ugandan",
  "Zambian",
  "Zimbabwean",
  "American",
  "Australian",
  "Bangladeshi",
  "British",
  "Canadian",
  "Chinese",
  "French",
  "German",
  "Indian",
  "Irish",
  "Italian",
  "Pakistani",
  "Portuguese",
  "Spanish",
  "Swazi",
  NATIONALITY_OTHER,
] as const;

const LISTED_NATIONALITIES: ReadonlySet<string> = new Set(
  NATIONALITY_OPTIONS.filter((item) => item !== NATIONALITY_OTHER),
);

export function nationalityDropdownValue(stored: string) {
  const trimmed = stored.trim();
  if (!trimmed) return "";
  if (LISTED_NATIONALITIES.has(trimmed)) return trimmed;
  return NATIONALITY_OTHER;
}

export function isCustomNationality(stored: string) {
  return nationalityDropdownValue(stored) === NATIONALITY_OTHER;
}

export const PROFILE_TABS = [
  { id: "personal", label: "Personal Details" },
  { id: "professional", label: "Professional Profile" },
  { id: "education", label: "Education" },
  { id: "experience", label: "Work Experience" },
  { id: "documents", label: "Documents" },
  { id: "questions", label: "Application Questions" },
  { id: "additional", label: "Additional Information" },
  { id: "privacy", label: "Privacy & Settings" },
] as const;

export type ProfileTabId = (typeof PROFILE_TABS)[number]["id"];
