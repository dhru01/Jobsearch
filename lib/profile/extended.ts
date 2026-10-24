export type SkillEntry = {
  id: string;
  name: string;
  proficiency: string;
  years: string;
  last_used: string;
  category: string;
};

export type LanguageItem = {
  language: string;
  spoken: string;
  written: string;
};

export type LicenceItem = {
  name: string;
  category: string;
  issuer: string;
  issued: string;
  expiry: string;
  credential_id: string;
};

export type ReferenceItem = {
  name: string;
  title: string;
  organisation: string;
  relationship: string;
  email: string;
  phone: string;
};

export type CustomAnswer = {
  id: string;
  question: string;
  answer: string;
  category: string;
  confirmed: boolean;
  updated_at: string;
};

export type ProfileExtended = {
  middle_name: string;
  date_of_birth: string;
  race: string;
  gender: string;
  alt_phone: string;
  calling_code: string;
  postal_code: string;
  location_geoname_id: string;
  location_lat: string;
  location_lng: string;
  work_countries: string;
  visa_type: string;
  visa_expiry: string;
  visa_sponsorship: string;
  currently_employed: string;
  current_job_title: string;
  career_level: string;
  occupation: string;
  specialisations: string;
  structured_skills: SkillEntry[];
  linkedin: string;
  github: string;
  website: string;
  portfolio: string;
  other_links: string;
  no_formal_experience: boolean;
  preferred_salary: string;
  salary_currency: string;
  salary_period: string;
  salary_negotiable: boolean;
  alternative_roles: string;
  relocate_international: boolean;
  preferred_countries: string;
  excluded_locations: string;
  excluded_titles: string;
  willing_to_travel: string;
  travel_percentage: string;
  preferred_hours: string;
  graduate_interest: boolean;
  languages: LanguageItem[];
  licences: LicenceItem[];
  references: ReferenceItem[];
  references_on_request: boolean;
  disability_disclosure: string;
  gender_disclosure: string;
  equity_disclosure: string;
  standard_answers: Record<string, string>;
  custom_answers: CustomAnswer[];
  ai_processing_ok: boolean;
  document_share_ok: boolean;
  document_slot_progress: Record<string, { in_progress?: boolean }>;
  identity_document_type: "" | "sa_id_card" | "passport";
};

export const emptySkill = (): SkillEntry => ({
  id: crypto.randomUUID(),
  name: "",
  proficiency: "",
  years: "",
  last_used: "",
  category: "general",
});

export const emptyLanguage = (): LanguageItem => ({ language: "", spoken: "", written: "" });
export const emptyLicence = (): LicenceItem => ({
  name: "",
  category: "",
  issuer: "",
  issued: "",
  expiry: "",
  credential_id: "",
});
export const emptyReference = (): ReferenceItem => ({
  name: "",
  title: "",
  organisation: "",
  relationship: "",
  email: "",
  phone: "",
});
export const emptyCustomAnswer = (): CustomAnswer => ({
  id: crypto.randomUUID(),
  question: "",
  answer: "",
  category: "custom",
  confirmed: false,
  updated_at: new Date().toISOString(),
});

export function emptyExtended(): ProfileExtended {
  return {
    middle_name: "",
    date_of_birth: "",
    race: "",
    gender: "",
    alt_phone: "",
    calling_code: "+27",
    postal_code: "",
    location_geoname_id: "",
    location_lat: "",
    location_lng: "",
    work_countries: "South Africa",
    visa_type: "",
    visa_expiry: "",
    visa_sponsorship: "",
    currently_employed: "",
    current_job_title: "",
    career_level: "",
    occupation: "",
    specialisations: "",
    structured_skills: [],
    linkedin: "",
    github: "",
    website: "",
    portfolio: "",
    other_links: "",
    no_formal_experience: false,
    preferred_salary: "",
    salary_currency: "ZAR",
    salary_period: "monthly",
    salary_negotiable: true,
    alternative_roles: "",
    relocate_international: false,
    preferred_countries: "",
    excluded_locations: "",
    excluded_titles: "",
    willing_to_travel: "",
    travel_percentage: "",
    preferred_hours: "",
    graduate_interest: false,
    languages: [emptyLanguage()],
    licences: [emptyLicence()],
    references: [emptyReference()],
    references_on_request: true,
    disability_disclosure: "prefer_not",
    gender_disclosure: "prefer_not",
    equity_disclosure: "prefer_not",
    standard_answers: {},
    custom_answers: [],
    ai_processing_ok: true,
    document_share_ok: false,
    document_slot_progress: {},
    identity_document_type: "",
  };
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeExtended(value: unknown): ProfileExtended {
  const raw = (value ?? {}) as Record<string, unknown>;
  const base = emptyExtended();
  return {
    ...base,
    middle_name: asString(raw.middle_name),
    date_of_birth: asString(raw.date_of_birth),
    race: asString(raw.race),
    gender: asString(raw.gender),
    alt_phone: asString(raw.alt_phone),
    calling_code: asString(raw.calling_code, "+27"),
    postal_code: asString(raw.postal_code),
    location_geoname_id: asString(raw.location_geoname_id),
    location_lat: raw.location_lat == null ? "" : String(raw.location_lat),
    location_lng: raw.location_lng == null ? "" : String(raw.location_lng),
    work_countries: asString(raw.work_countries, "South Africa"),
    visa_type: asString(raw.visa_type),
    visa_expiry: asString(raw.visa_expiry),
    visa_sponsorship: asString(raw.visa_sponsorship),
    currently_employed: asString(raw.currently_employed),
    current_job_title: asString(raw.current_job_title),
    career_level: asString(raw.career_level),
    occupation: asString(raw.occupation),
    specialisations: asString(raw.specialisations),
    structured_skills: Array.isArray(raw.structured_skills)
      ? raw.structured_skills.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            id: asString(row.id) || crypto.randomUUID(),
            name: asString(row.name),
            proficiency: asString(row.proficiency),
            years: asString(row.years),
            last_used: asString(row.last_used),
            category: asString(row.category, "general"),
          };
        })
      : [],
    linkedin: asString(raw.linkedin),
    github: asString(raw.github),
    website: asString(raw.website),
    portfolio: asString(raw.portfolio),
    other_links: asString(raw.other_links),
    no_formal_experience: asBool(raw.no_formal_experience),
    preferred_salary: asString(raw.preferred_salary),
    salary_currency: asString(raw.salary_currency, "ZAR"),
    salary_period: asString(raw.salary_period, "monthly"),
    salary_negotiable: asBool(raw.salary_negotiable, true),
    alternative_roles: asString(raw.alternative_roles),
    relocate_international: asBool(raw.relocate_international),
    preferred_countries: asString(raw.preferred_countries),
    excluded_locations: asString(raw.excluded_locations),
    excluded_titles: asString(raw.excluded_titles),
    willing_to_travel: asString(raw.willing_to_travel),
    travel_percentage: asString(raw.travel_percentage),
    preferred_hours: asString(raw.preferred_hours),
    graduate_interest: asBool(raw.graduate_interest),
    languages: Array.isArray(raw.languages) && raw.languages.length
      ? raw.languages.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return { language: asString(row.language), spoken: asString(row.spoken), written: asString(row.written) };
        })
      : [emptyLanguage()],
    licences: Array.isArray(raw.licences) && raw.licences.length
      ? raw.licences.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            name: asString(row.name),
            category: asString(row.category),
            issuer: asString(row.issuer),
            issued: asString(row.issued),
            expiry: asString(row.expiry),
            credential_id: asString(row.credential_id),
          };
        })
      : [emptyLicence()],
    references: Array.isArray(raw.references) && raw.references.length
      ? raw.references.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            name: asString(row.name),
            title: asString(row.title),
            organisation: asString(row.organisation),
            relationship: asString(row.relationship),
            email: asString(row.email),
            phone: asString(row.phone),
          };
        })
      : [emptyReference()],
    references_on_request: asBool(raw.references_on_request, true),
    disability_disclosure: asString(raw.disability_disclosure, "prefer_not"),
    gender_disclosure: asString(raw.gender_disclosure, "prefer_not"),
    equity_disclosure: asString(raw.equity_disclosure, "prefer_not"),
    standard_answers:
      raw.standard_answers && typeof raw.standard_answers === "object" && !Array.isArray(raw.standard_answers)
        ? Object.fromEntries(
            Object.entries(raw.standard_answers as Record<string, unknown>).map(([key, value]) => [
              key,
              asString(value),
            ]),
          )
        : {},
    custom_answers: Array.isArray(raw.custom_answers)
      ? raw.custom_answers.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            id: asString(row.id) || crypto.randomUUID(),
            question: asString(row.question),
            answer: asString(row.answer),
            category: asString(row.category, "custom"),
            confirmed: asBool(row.confirmed),
            updated_at: asString(row.updated_at, new Date().toISOString()),
          };
        })
      : [],
    ai_processing_ok: asBool(raw.ai_processing_ok, true),
    document_share_ok: asBool(raw.document_share_ok),
    document_slot_progress:
      raw.document_slot_progress && typeof raw.document_slot_progress === "object" && !Array.isArray(raw.document_slot_progress)
        ? (raw.document_slot_progress as Record<string, { in_progress?: boolean }>)
        : {},
    identity_document_type:
      raw.identity_document_type === "sa_id_card" || raw.identity_document_type === "passport"
        ? raw.identity_document_type
        : "",
  };
}

export function skillsFromLegacy(names: string[], category: string): SkillEntry[] {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ ...emptySkill(), name, category }));
}
