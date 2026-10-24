"use client";

import { type FormEvent, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveProfile, type ProfileState } from "@/lib/actions/profile";
import { deleteAccount, exportMyData } from "@/lib/actions/account";
import { Alert, FieldLabel, fieldClass } from "@/components/field";
import {
  createEmptyEducation,
  normalizeEducationForForm,
  withDemoProfile,
  type EducationItem,
  type ExperienceItem,
  type ProfileDraft,
} from "@/lib/profile";
import { qualificationsFromEducation } from "@/lib/profile/qualifications-from-education";
import {
  CAREER_LEVELS,
  EDUCATION_STATUSES,
  EMPLOYMENT_TYPES,
  LANGUAGE_PROFICIENCY,
  NOTICE_PERIOD_OPTIONS,
  noticePeriodSelectValue,
  YEARS_EXPERIENCE_RANGE_OPTIONS,
  yearsExperienceRangeSelectValue,
  profileYearsFromExperienceRange,
  PROFILE_TABS,
  SA_QUALIFICATION_OPTIONS,
  STANDARD_APPLICATION_QUESTIONS,
  YES_NO_APPLICATION_ANSWERS,
  yesNoApplicationAnswerValue,
  WORK_ARRANGEMENTS,
  WORK_AUTHORISATION_OPTIONS,
  YES_NO_UNSURE,
  NATIONALITY_OPTIONS,
  NATIONALITY_OTHER,
  RACE_OPTIONS,
  GENDER_OPTIONS,
  isCustomNationality,
  nationalityDropdownValue,
  type ProfileTabId,
} from "@/lib/profile/constants";
import {
  emptyCustomAnswer,
  emptyLanguage,
  emptyReference,
  emptySkill,
  type ProfileExtended,
} from "@/lib/profile/extended";
import { composedFullName } from "@/lib/profile/name-split";
import { identityDocumentsReadiness } from "@/lib/documents/identity-readiness";
import { profileReadiness } from "@/lib/profile/readiness";
import { LocationSuggestInput } from "@/components/location-suggest-input";
import { DegreeSuggestInput } from "@/components/degree-suggest-input";
import { LanguagesMultiSelect } from "@/components/languages-multi-select";
import { SkillsSuggestInput } from "@/components/skills-suggest-input";
import { DocumentsPanel, type ProfileDocument } from "@/components/profile/documents-panel";
import { ProfileReadinessPanel } from "@/components/profile/profile-readiness-panel";
import { ProfileTabs } from "@/components/profile/profile-tabs";

const initial: ProfileState = { error: null };

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPayload(draft: ProfileDraft) {
  const yearsRaw = draft.years_experience.trim();
  let years_experience: number | null = null;
  if (yearsRaw !== "") {
    const parsed = Number(yearsRaw);
    years_experience = Number.isFinite(parsed) ? parsed : null;
  }

  const salaryRaw = draft.min_salary.trim();
  const min_salary = salaryRaw === "" ? null : Number(salaryRaw);

  return {
    full_name: composedFullName({
      first_name: draft.first_name,
      last_name: draft.last_name,
      middle_name: draft.extended.middle_name,
      full_name: draft.full_name,
    }),
    first_name: draft.first_name,
    last_name: draft.last_name,
    preferred_name: draft.preferred_name,
    email: draft.email,
    phone: draft.phone,
    location: draft.location,
    country: draft.country || "ZA",
    province: draft.province,
    city: draft.city,
    address: draft.address,
    nationality: draft.nationality,
    work_authorisation: draft.work_authorisation,
    availability_date: draft.availability_date,
    notice_period: draft.notice_period,
    headline: draft.headline,
    summary: draft.summary,
    skills: [
      ...splitList(draft.skills),
      ...draft.extended.structured_skills.map((item) => item.name.trim()).filter(Boolean),
    ].filter((item, index, all) => all.indexOf(item) === index),
    skills_detail: {
      technical: [
        ...splitList(draft.technical_skills),
        ...draft.extended.structured_skills.filter((item) => item.category === "technical").map((item) => item.name),
      ].filter(Boolean),
      software: [
        ...splitList(draft.software),
        ...draft.extended.structured_skills.filter((item) => item.category === "software").map((item) => item.name),
      ].filter(Boolean),
      languages: [
        ...splitList(draft.languages),
        ...draft.extended.languages.map((item) => item.language).filter(Boolean),
      ],
      certifications: splitList(draft.certifications),
      other: splitList(draft.other_skills),
    },
    years_experience,
    education: draft.education,
    experience: draft.experience,
    qualifications: qualificationsFromEducation(draft.education),
    preferences: {
      roles: splitList(draft.roles),
      locations: splitList(draft.locations),
      work_modes: draft.work_modes,
      open_to_relocate: draft.open_to_relocate,
      digest_email: Boolean(draft.digest_email),
      industries: splitList(draft.industries),
      employment_types: splitList(draft.employment_types),
      seniority: draft.seniority,
      min_salary: min_salary != null && Number.isFinite(min_salary) ? min_salary : null,
      excluded_companies: splitList(draft.excluded_companies),
      excluded_industries: splitList(draft.excluded_industries),
    },
    accuracy_confirmed: draft.accuracy_confirmed,
    profile_extended: draft.extended,
  };
}

function RequiredMark() {
  return <span className="text-accent"> *</span>;
}

function SaveSection({ pending, mode }: { pending: boolean; mode: "confirm" | "edit" }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : mode === "confirm" ? "Confirm profile" : "Save changes"}
      </button>
      <p className="text-xs text-muted">Only confirmed information is used for matching and applications.</p>
    </div>
  );
}

export function ProfileForm({
  initialDraft,
  mode,
  documents = [],
  initialTab,
}: {
  initialDraft: ProfileDraft;
  mode: "confirm" | "edit";
  documents?: ProfileDocument[];
  initialTab?: string;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [tab, setTab] = useState<ProfileTabId>(
    PROFILE_TABS.some((item) => item.id === initialTab) ? (initialTab as ProfileTabId) : "personal",
  );
  const [state, action, pending] = useActionState(saveProfile, initial);
  function patch(partial: Partial<ProfileDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function patchExtended(partial: Partial<ProfileExtended>) {
    setDraft((current) => ({ ...current, extended: { ...current.extended, ...partial } }));
  }

  const snapshot = useMemo(() => JSON.stringify(toPayload(initialDraft)), [initialDraft]);
  const dirty = JSON.stringify(toPayload(draft)) !== snapshot;
  const identityReadiness = identityDocumentsReadiness(documents, draft.extended.identity_document_type);
  const readiness = profileReadiness(draft, {
    hasCv: documents.some((doc) => doc.kind === "cv" || doc.slot === "cv"),
    identityDocumentsComplete: identityReadiness.complete,
    identityMissing: identityReadiness.missing,
  });

  useEffect(() => {
    function onLeave(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const payloadRef = useRef<HTMLInputElement>(null);
  const tabRef = useRef<HTMLInputElement>(null);

  function syncSaveFields() {
    if (payloadRef.current) {
      payloadRef.current.value = JSON.stringify(toPayload(draft));
    }
    if (tabRef.current) {
      tabRef.current.value = tab;
    }
  }

  useEffect(() => {
    syncSaveFields();
  }, [draft, tab]);

  function handleSubmit(_event: FormEvent<HTMLFormElement>) {
    syncSaveFields();
    // Native form submission keeps the auth session on the server action.
  }

  return (
    <form action={action} className="space-y-6" onSubmit={handleSubmit}>
      <input ref={payloadRef} type="hidden" name="payload" />
      <input ref={tabRef} type="hidden" name="tab" />

      {mode === "edit" ? (
        <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-bg/95 px-4 py-3 backdrop-blur-sm">
          <p className="text-sm text-muted">
            {dirty ? "This section has unsaved edits." : "Switching tabs keeps your draft until you leave the page."}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
        </div>
      ) : null}

      {state.error ? <Alert>{state.error}</Alert> : null}

      {mode === "confirm" ? (
        <div className="flex flex-col gap-3 rounded-[1.25rem] border border-line bg-panel px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Demo data keeps this account&apos;s name and email, and fills the rest with a Cape Town graduate profile.
          </p>
          <button
            type="button"
            className="shrink-0 rounded-full border border-line bg-raised px-4 py-2 text-sm text-ink transition hover:border-accent"
            onClick={() => setDraft((current) => withDemoProfile(current))}
          >
            Fill with demo data
          </button>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5">
      <ProfileTabs active={tab} onChange={setTab} readiness={readiness.tabs} />

      <div
        role="tabpanel"
        id={`profile-panel-${tab}`}
        aria-labelledby={`profile-tab-${tab}`}
        className="space-y-5 rounded-[1.5rem] border border-line bg-raised p-5 shadow-[0_14px_36px_-30px_rgba(28,22,18,0.5)] sm:p-6"
      >
        {tab === "personal" ? (
          <PersonalTab draft={draft} patch={patch} patchExtended={patchExtended} />
        ) : null}
        {tab === "professional" ? <ProfessionalTab draft={draft} patch={patch} patchExtended={patchExtended} /> : null}
        {tab === "education" ? <EducationTab draft={draft} patch={patch} /> : null}
        {tab === "experience" ? <ExperienceTab draft={draft} patch={patch} patchExtended={patchExtended} /> : null}
        {tab === "documents" ? (
          <DocumentsPanel
            documents={documents}
            education={draft.education}
            slotProgress={draft.extended.document_slot_progress}
            identityDocumentTypeStored={draft.extended.identity_document_type}
            onIdentityDocumentTypeChange={(type) => patchExtended({ identity_document_type: type })}
          />
        ) : null}
        {tab === "questions" ? <QuestionsTab draft={draft} patch={patch} patchExtended={patchExtended} /> : null}
        {tab === "additional" ? <AdditionalTab draft={draft} patchExtended={patchExtended} /> : null}
        {tab === "privacy" ? <PrivacyTab draft={draft} patch={patch} patchExtended={patchExtended} /> : null}
        {tab !== "documents" ? <SaveSection pending={pending} mode={mode} /> : null}
      </div>
        </div>

        <ProfileReadinessPanel
          readiness={readiness}
          activeTab={tab}
          onJump={setTab}
          dirty={dirty}
        />
      </div>
    </form>
  );
}

function PersonalTab({
  draft,
  patch,
  patchExtended,
}: {
  draft: ProfileDraft;
  patch: (partial: Partial<ProfileDraft>) => void;
  patchExtended: (partial: Partial<ProfileExtended>) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-base font-medium">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="first_name">
              First name
              <RequiredMark />
            </FieldLabel>
            <input id="first_name" value={draft.first_name} onChange={(e) => patch({ first_name: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="last_name">
              Last name
              <RequiredMark />
            </FieldLabel>
            <input id="last_name" value={draft.last_name} onChange={(e) => patch({ last_name: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="preferred_name">Preferred name</FieldLabel>
            <input id="preferred_name" value={draft.preferred_name} onChange={(e) => patch({ preferred_name: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="middle_name">Middle name</FieldLabel>
            <input
              id="middle_name"
              value={draft.extended.middle_name}
              onChange={(e) => patchExtended({ middle_name: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="date_of_birth">
              Date of birth
              <RequiredMark />
            </FieldLabel>
            <input
              id="date_of_birth"
              type="date"
              value={draft.extended.date_of_birth}
              onChange={(e) => patchExtended({ date_of_birth: e.target.value })}
              className={fieldClass}
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="race">
              Race
              <RequiredMark />
            </FieldLabel>
            <select
              id="race"
              className={fieldClass}
              required
              value={draft.extended.race}
              onChange={(e) => patchExtended({ race: e.target.value })}
            >
              <option value="">Select race</option>
              {RACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="nationality">
              Nationality
              <RequiredMark />
            </FieldLabel>
            <select
              id="nationality"
              className={fieldClass}
              required
              value={nationalityDropdownValue(draft.nationality)}
              onChange={(e) => {
                const value = e.target.value;
                if (value === NATIONALITY_OTHER) {
                  patch({ nationality: isCustomNationality(draft.nationality) ? draft.nationality : "" });
                  return;
                }
                patch({ nationality: value });
              }}
            >
              <option value="">Select nationality</option>
              {NATIONALITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="gender">Gender</FieldLabel>
            <select
              id="gender"
              className={fieldClass}
              value={draft.extended.gender}
              onChange={(e) => patchExtended({ gender: e.target.value })}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {nationalityDropdownValue(draft.nationality) === NATIONALITY_OTHER ? (
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="nationality_other">Specify nationality</FieldLabel>
              <input
                id="nationality_other"
                className={fieldClass}
                placeholder="Specify your nationality"
                value={draft.nationality}
                onChange={(e) => patch({ nationality: e.target.value })}
                required
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Contact details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="email">
              Email
              <RequiredMark />
            </FieldLabel>
            <input id="email" type="email" value={draft.email} onChange={(e) => patch({ email: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="phone">
              Mobile phone
              <RequiredMark />
            </FieldLabel>
            <input
              id="phone"
              value={draft.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="+27 82 000 0000"
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="alt_phone">Alternative phone</FieldLabel>
            <input
              id="alt_phone"
              value={draft.extended.alt_phone}
              onChange={(e) => patchExtended({ alt_phone: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="city">
              Residential city
              <RequiredMark />
            </FieldLabel>
            <LocationSuggestInput
              value={draft.city}
              placeholder="Search South African places"
              className={fieldClass}
              onValueChange={(city) => patch({ city, location: city || draft.location })}
              onSelectSuggestion={(item) => {
                patch({
                  city: item.primary,
                  province: item.secondary || draft.province,
                  location: item.label,
                  country: draft.country || "ZA",
                });
                patchExtended({
                  location_geoname_id: item.id.startsWith("static:") ? "" : item.id,
                  location_lat: item.latitude != null ? String(item.latitude) : "",
                  location_lng: item.longitude != null ? String(item.longitude) : "",
                });
              }}
            />
          </div>
          <div>
            <FieldLabel htmlFor="province">
              Province
              <RequiredMark />
            </FieldLabel>
            <input id="province" value={draft.province} onChange={(e) => patch({ province: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="postal_code">Postal code</FieldLabel>
            <input
              id="postal_code"
              value={draft.extended.postal_code}
              onChange={(e) => patchExtended({ postal_code: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="address">Residential address (optional)</FieldLabel>
            <input id="address" value={draft.address} onChange={(e) => patch({ address: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="country">
              Country
              <RequiredMark />
            </FieldLabel>
            <input id="country" value={draft.country} onChange={(e) => patch({ country: e.target.value })} className={fieldClass} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Work eligibility</h2>
        <p className="text-sm text-muted">Nationality is not treated as work authorisation.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="work_countries">Countries you are authorised to work in</FieldLabel>
            <input
              id="work_countries"
              value={draft.extended.work_countries}
              onChange={(e) => patchExtended({ work_countries: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="work_authorisation">Work authorisation status</FieldLabel>
            <select
              id="work_authorisation"
              value={draft.work_authorisation}
              onChange={(e) => patch({ work_authorisation: e.target.value })}
              className={fieldClass}
            >
              <option value="">Not specified</option>
              {WORK_AUTHORISATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="visa_type">Permit / visa type</FieldLabel>
            <input
              id="visa_type"
              value={draft.extended.visa_type}
              onChange={(e) => patchExtended({ visa_type: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="visa_expiry">Permit expiry</FieldLabel>
            <input
              id="visa_expiry"
              type="date"
              value={draft.extended.visa_expiry}
              onChange={(e) => patchExtended({ visa_expiry: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="visa_sponsorship">Requires employer visa sponsorship</FieldLabel>
            <select
              id="visa_sponsorship"
              value={draft.extended.visa_sponsorship}
              onChange={(e) => patchExtended({ visa_sponsorship: e.target.value })}
              className={fieldClass}
            >
              {YES_NO_UNSURE.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="availability_date">Available start date</FieldLabel>
            <input
              id="availability_date"
              type="date"
              value={draft.availability_date}
              onChange={(e) => patch({ availability_date: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="currently_employed">Currently employed</FieldLabel>
            <select
              id="currently_employed"
              value={draft.extended.currently_employed}
              onChange={(e) => {
                const value = e.target.value;
                patchExtended({ currently_employed: value });
                if (value === "no") {
                  patch({ notice_period: "" });
                }
              }}
              className={fieldClass}
            >
              <option value="">Not specified</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="notice_period">Notice period</FieldLabel>
            <select
              id="notice_period"
              value={noticePeriodSelectValue(draft.notice_period)}
              onChange={(e) => patch({ notice_period: e.target.value })}
              className={fieldClass}
              disabled={draft.extended.currently_employed === "no"}
              aria-disabled={draft.extended.currently_employed === "no"}
              title={
                draft.extended.currently_employed === "no"
                  ? "Notice period is not required when you are not currently employed."
                  : undefined
              }
            >
              <option value="">Select notice period</option>
              {NOTICE_PERIOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {draft.extended.currently_employed === "no" ? (
              <p className="mt-1.5 text-xs text-muted">Not applicable when you are not currently employed.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfessionalTab({
  draft,
  patch,
  patchExtended,
}: {
  draft: ProfileDraft;
  patch: (partial: Partial<ProfileDraft>) => void;
  patchExtended: (partial: Partial<ProfileExtended>) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-base font-medium">Professional overview</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="headline">Professional headline</FieldLabel>
            <input id="headline" value={draft.headline} onChange={(e) => patch({ headline: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <FieldLabel htmlFor="current_job_title">Current job title</FieldLabel>
            <input
              id="current_job_title"
              value={draft.extended.current_job_title}
              onChange={(e) => patchExtended({ current_job_title: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="years_experience">Total years of experience</FieldLabel>
            <input
              id="years_experience"
              type="number"
              min={0}
              max={60}
              step="0.5"
              value={draft.years_experience}
              onChange={(e) => patch({ years_experience: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="career_level">Career level</FieldLabel>
            <select
              id="career_level"
              value={draft.extended.career_level}
              onChange={(e) => patchExtended({ career_level: e.target.value })}
              className={fieldClass}
            >
              <option value="">Not specified</option>
              {CAREER_LEVELS.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="occupation">Primary occupation</FieldLabel>
            <input
              id="occupation"
              value={draft.extended.occupation}
              onChange={(e) => patchExtended({ occupation: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="specialisations">Areas of specialisation</FieldLabel>
            <input
              id="specialisations"
              value={draft.extended.specialisations}
              onChange={(e) => patchExtended({ specialisations: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="summary">Professional summary</FieldLabel>
            <textarea id="summary" value={draft.summary} onChange={(e) => patch({ summary: e.target.value })} rows={4} className={fieldClass} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Skills</h2>
        <p className="text-sm text-muted">Search for a skill to see suggestions, or type your own. Structured rows are optional.</p>
        <div>
          <FieldLabel htmlFor="skills">Skills used for matching</FieldLabel>
          <SkillsSuggestInput
            id="skills"
            value={draft.skills}
            onChange={(skills) => patch({ skills })}
            placeholder="e.g. Customer service, Cash handling, Excel, Team leadership"
            showHint
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="technical_skills">Technical skills</FieldLabel>
            <SkillsSuggestInput
              id="technical_skills"
              value={draft.technical_skills}
              onChange={(technical_skills) => patch({ technical_skills })}
              placeholder="Technical skills"
            />
          </div>
          <div>
            <FieldLabel htmlFor="software">Software and tools</FieldLabel>
            <SkillsSuggestInput
              id="software"
              value={draft.software}
              onChange={(software) => patch({ software })}
              placeholder="Software and tools"
            />
          </div>
          <div>
            <FieldLabel htmlFor="languages_skills">People skills</FieldLabel>
            <SkillsSuggestInput
              id="languages_skills"
              value={draft.languages}
              onChange={(languages) => patch({ languages })}
              placeholder="e.g. Communication, Teamwork, Leadership"
            />
          </div>
          <div>
            <FieldLabel htmlFor="other_skills">Languages</FieldLabel>
            <LanguagesMultiSelect
              id="other_skills"
              value={draft.other_skills}
              onChange={(other_skills) => patch({ other_skills })}
            />
          </div>
        </div>
        <div className="space-y-3">
          {draft.extended.structured_skills.map((skill, index) => (
            <div key={skill.id} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-4">
              <SkillsSuggestInput
                value={skill.name}
                mode="single"
                placeholder="Skill name"
                className={fieldClass}
                onChange={(name) => {
                  const structured_skills = draft.extended.structured_skills.slice();
                  structured_skills[index] = { ...skill, name };
                  patchExtended({ structured_skills });
                }}
              />
              <select
                value={skill.category}
                className={fieldClass}
                onChange={(e) => {
                  const structured_skills = draft.extended.structured_skills.slice();
                  structured_skills[index] = { ...skill, category: e.target.value };
                  patchExtended({ structured_skills });
                }}
              >
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="software">Software</option>
                <option value="industry">Industry</option>
                <option value="languages">People skills</option>
                <option value="other">Other</option>
              </select>
              <input
                value={skill.years}
                placeholder="Years"
                className={fieldClass}
                onChange={(e) => {
                  const structured_skills = draft.extended.structured_skills.slice();
                  structured_skills[index] = { ...skill, years: e.target.value };
                  patchExtended({ structured_skills });
                }}
              />
              <button
                type="button"
                className="text-sm text-muted underline"
                onClick={() =>
                  patchExtended({
                    structured_skills: draft.extended.structured_skills.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-accent"
            onClick={() => patchExtended({ structured_skills: [...draft.extended.structured_skills, emptySkill()] })}
          >
            Add structured skill
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Professional links</h2>
        <p className="text-sm text-muted">Optional. Paste any public link employers can review — not only tech profiles.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
              { key: "other_links", label: "Other links", placeholder: "Any other relevant URL" },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <FieldLabel htmlFor={key}>{label}</FieldLabel>
              <input
                id={key}
                type="url"
                value={draft.extended[key]}
                onChange={(e) => patchExtended({ [key]: e.target.value })}
                className={fieldClass}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EducationTab({ draft, patch }: { draft: ProfileDraft; patch: (partial: Partial<ProfileDraft>) => void }) {
  function patchEducation(education: EducationItem[]) {
    patch({ education: normalizeEducationForForm(education) });
  }

  function update(index: number, partial: Partial<EducationItem>) {
    const education = draft.education.slice();
    education[index] = { ...education[index], ...partial };
    patchEducation(education);
  }

  const canRemoveRow = draft.education.length > 1;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Add every qualification you want employers to see. Level and title are also used for job matching. Grades stay
        optional.
      </p>
      {draft.education.map((item, index) => (
        <div key={index} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
          <input className={fieldClass} placeholder="Institution" value={item.institution} onChange={(e) => update(index, { institution: e.target.value })} />
          <input className={fieldClass} placeholder="Institution location" value={item.location} onChange={(e) => update(index, { location: e.target.value })} />
          <select className={fieldClass} value={item.level} onChange={(e) => update(index, { level: e.target.value })}>
            <option value="">Qualification level</option>
            {SA_QUALIFICATION_OPTIONS.map((option) => (
              <option key={`${option.label}-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <DegreeSuggestInput
            className={fieldClass}
            placeholder="Qualification title"
            value={item.qualification}
            level={item.level}
            onChange={(qualification) => update(index, { qualification })}
          />
          <input className={fieldClass} placeholder="Field of study" value={item.field} onChange={(e) => update(index, { field: e.target.value })} />
          <input className={fieldClass} placeholder="Major / specialisation" value={item.major} onChange={(e) => update(index, { major: e.target.value })} />
          <input className={fieldClass} placeholder="Start month" value={item.start_month} onChange={(e) => update(index, { start_month: e.target.value })} />
          <input className={fieldClass} placeholder="Start year" value={item.start_year} onChange={(e) => update(index, { start_year: e.target.value })} />
          <input className={fieldClass} placeholder="End month" value={item.end_month} onChange={(e) => update(index, { end_month: e.target.value })} />
          <input className={fieldClass} placeholder="End / expected year" value={item.end_year} onChange={(e) => update(index, { end_year: e.target.value })} />
          <select className={fieldClass} value={item.status} onChange={(e) => update(index, { status: e.target.value })}>
            <option value="">Status</option>
            {EDUCATION_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-accent"
              checked={item.currently_studying}
              onChange={(e) => update(index, { currently_studying: e.target.checked, status: e.target.checked ? "In progress" : item.status })}
            />
            Currently studying
          </label>
          <input className={`${fieldClass} sm:col-span-2`} placeholder="Academic achievements" value={item.achievements} onChange={(e) => update(index, { achievements: e.target.value })} />
          <input className={`${fieldClass} sm:col-span-2`} placeholder="Relevant coursework" value={item.coursework} onChange={(e) => update(index, { coursework: e.target.value })} />
          <input className={fieldClass} placeholder="Final grade / GPA (optional)" value={item.grade} onChange={(e) => update(index, { grade: e.target.value })} />
          {canRemoveRow ? (
            <button
              type="button"
              className="text-sm text-muted underline"
              onClick={() => patchEducation(draft.education.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-accent"
        onClick={() => patchEducation([...draft.education, createEmptyEducation()])}
      >
        Add another qualification
      </button>
    </div>
  );
}

function ExperienceTab({
  draft,
  patch,
  patchExtended,
}: {
  draft: ProfileDraft;
  patch: (partial: Partial<ProfileDraft>) => void;
  patchExtended: (partial: Partial<ProfileExtended>) => void;
}) {
  function update(index: number, partial: Partial<ExperienceItem>) {
    const experience = draft.experience.slice();
    experience[index] = { ...experience[index], ...partial };
    patch({ experience });
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-accent"
          checked={draft.extended.no_formal_experience}
          onChange={(e) => patchExtended({ no_formal_experience: e.target.checked })}
        />
        No formal work experience yet
      </label>
      <p className="text-sm text-muted">
        Internships, vacation work, freelance, volunteering and university projects can be listed accurately — they are
        not treated as full-time jobs unless you say so.
      </p>
      {draft.experience.map((item, index) => (
        <div key={index} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
          <input className={fieldClass} placeholder="Job title" value={item.title} onChange={(e) => update(index, { title: e.target.value })} />
          <input className={fieldClass} placeholder="Employer / organisation" value={item.organisation} onChange={(e) => update(index, { organisation: e.target.value })} />
          <select className={fieldClass} value={item.employment_type} onChange={(e) => update(index, { employment_type: e.target.value })}>
            <option value="">Employment type</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <select className={fieldClass} value={item.arrangement} onChange={(e) => update(index, { arrangement: e.target.value })}>
            <option value="">Work arrangement</option>
            {WORK_ARRANGEMENTS.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input className={fieldClass} placeholder="City" value={item.city} onChange={(e) => update(index, { city: e.target.value })} />
          <input className={fieldClass} placeholder="Province" value={item.province} onChange={(e) => update(index, { province: e.target.value })} />
          <input className={fieldClass} placeholder="Country" value={item.country} onChange={(e) => update(index, { country: e.target.value })} />
          <input className={fieldClass} placeholder="Industry" value={item.industry} onChange={(e) => update(index, { industry: e.target.value })} />
          <input className={fieldClass} placeholder="Start month/year" value={item.start} onChange={(e) => update(index, { start: e.target.value })} />
          <input className={fieldClass} placeholder="End month/year" value={item.end} disabled={item.current} onChange={(e) => update(index, { end: e.target.value })} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="accent-accent"
              checked={item.current}
              onChange={(e) => update(index, { current: e.target.checked, end: e.target.checked ? "Present" : item.end })}
            />
            Currently working here
          </label>
          <textarea className={`${fieldClass} sm:col-span-2`} rows={3} placeholder="Job description" value={item.summary} onChange={(e) => update(index, { summary: e.target.value })} />
          <textarea className={`${fieldClass} sm:col-span-2`} rows={2} placeholder="Key responsibilities" value={item.responsibilities} onChange={(e) => update(index, { responsibilities: e.target.value })} />
          <input className={fieldClass} placeholder="Measurable achievements" value={item.achievements} onChange={(e) => update(index, { achievements: e.target.value })} />
          <input className={fieldClass} placeholder="Skills used" value={item.skills_used} onChange={(e) => update(index, { skills_used: e.target.value })} />
          <input className={fieldClass} placeholder="Technologies / software" value={item.technologies} onChange={(e) => update(index, { technologies: e.target.value })} />
          <input className={fieldClass} placeholder="Reason for leaving (optional)" value={item.reason_for_leaving} onChange={(e) => update(index, { reason_for_leaving: e.target.value })} />
          <button
            type="button"
            className="text-sm text-muted underline"
            onClick={() => patch({ experience: draft.experience.filter((_, itemIndex) => itemIndex !== index) })}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-accent"
        onClick={() =>
          patch({
            experience: [
              ...draft.experience,
              {
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
              },
            ],
          })
        }
      >
        Add experience
      </button>
    </div>
  );
}


function QuestionsTab({
  draft,
  patch,
  patchExtended,
}: {
  draft: ProfileDraft;
  patch: (partial: Partial<ProfileDraft>) => void;
  patchExtended: (partial: Partial<ProfileExtended>) => void;
}) {
  function setAnswer(id: string, value: string) {
    patchExtended({ standard_answers: { ...draft.extended.standard_answers, [id]: value } });
    if (id === "notice_period") {
      patch({ notice_period: value });
    }
    if (id === "years_experience") {
      const years = profileYearsFromExperienceRange(value);
      if (years !== "") {
        patch({ years_experience: years });
      } else if (!value) {
        patch({ years_experience: "" });
      }
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        These are reusable drafts. They are not sent to an employer until you review and approve them for that
        application. Unknown, no, and not applicable are different answers — leave a field blank if you have not
        confirmed it.
      </p>
      {["Work eligibility", "Employment", "Qualifications", "Experience", "Other"].map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-base font-medium">{category}</h2>
          {STANDARD_APPLICATION_QUESTIONS.filter((item) => item.category === category).map((item) => (
            <div key={item.id}>
              <FieldLabel htmlFor={item.id}>{item.question}</FieldLabel>
              {item.answerType === "yes_no" ? (
                <select
                  id={item.id}
                  value={yesNoApplicationAnswerValue(draft.extended.standard_answers[item.id] ?? "")}
                  onChange={(e) => setAnswer(item.id, e.target.value)}
                  className={fieldClass}
                >
                  {YES_NO_APPLICATION_ANSWERS.map((option) => (
                    <option key={option.value || "unset"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : item.answerType === "notice_period" ? (
                <select
                  id={item.id}
                  value={noticePeriodSelectValue(
                    draft.extended.standard_answers[item.id] ?? draft.notice_period ?? "",
                  )}
                  onChange={(e) => setAnswer(item.id, e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select notice period</option>
                  {NOTICE_PERIOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : item.answerType === "years_experience_range" ? (
                <select
                  id={item.id}
                  value={yearsExperienceRangeSelectValue(
                    draft.extended.standard_answers[item.id] ?? "",
                    draft.years_experience,
                  )}
                  onChange={(e) => setAnswer(item.id, e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select years of experience</option>
                  {YEARS_EXPERIENCE_RANGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : item.answerType === "long_text" ? (
                <textarea
                  id={item.id}
                  rows={3}
                  value={draft.extended.standard_answers[item.id] ?? ""}
                  onChange={(e) => setAnswer(item.id, e.target.value)}
                  className={fieldClass}
                />
              ) : (
                <input
                  id={item.id}
                  type="text"
                  value={draft.extended.standard_answers[item.id] ?? ""}
                  onChange={(e) => setAnswer(item.id, e.target.value)}
                  className={fieldClass}
                />
              )}
            </div>
          ))}
        </section>
      ))}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Additional application answers</h2>
        {draft.extended.custom_answers.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-xl border border-line p-4">
            <input
              className={fieldClass}
              placeholder="Question"
              value={item.question}
              onChange={(e) => {
                const custom_answers = draft.extended.custom_answers.slice();
                custom_answers[index] = { ...item, question: e.target.value, updated_at: new Date().toISOString() };
                patchExtended({ custom_answers });
              }}
            />
            <textarea
              className={fieldClass}
              rows={3}
              placeholder="Answer"
              value={item.answer}
              onChange={(e) => {
                const custom_answers = draft.extended.custom_answers.slice();
                custom_answers[index] = { ...item, answer: e.target.value, updated_at: new Date().toISOString() };
                patchExtended({ custom_answers });
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <input
                className={fieldClass}
                placeholder="Category"
                value={item.category}
                onChange={(e) => {
                  const custom_answers = draft.extended.custom_answers.slice();
                  custom_answers[index] = { ...item, category: e.target.value };
                  patchExtended({ custom_answers });
                }}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={item.confirmed}
                  onChange={(e) => {
                    const custom_answers = draft.extended.custom_answers.slice();
                    custom_answers[index] = { ...item, confirmed: e.target.checked };
                    patchExtended({ custom_answers });
                  }}
                />
                Confirmed
              </label>
              <p className="text-xs text-muted">Updated {new Date(item.updated_at).toLocaleDateString("en-ZA")}</p>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-accent"
          onClick={() => patchExtended({ custom_answers: [...draft.extended.custom_answers, emptyCustomAnswer()] })}
        >
          Add a custom question
        </button>
      </section>
    </div>
  );
}

function AdditionalTab({
  draft,
  patchExtended,
}: {
  draft: ProfileDraft;
  patchExtended: (partial: Partial<ProfileExtended>) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-medium">Languages</h2>
        {draft.extended.languages.map((item, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-3">
            <input
              className={fieldClass}
              placeholder="Language"
              value={item.language}
              onChange={(e) => {
                const languages = draft.extended.languages.slice();
                languages[index] = { ...item, language: e.target.value };
                patchExtended({ languages });
              }}
            />
            <select
              className={fieldClass}
              value={item.spoken}
              onChange={(e) => {
                const languages = draft.extended.languages.slice();
                languages[index] = { ...item, spoken: e.target.value };
                patchExtended({ languages });
              }}
            >
              <option value="">Spoken</option>
              {LANGUAGE_PROFICIENCY.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
            <select
              className={fieldClass}
              value={item.written}
              onChange={(e) => {
                const languages = draft.extended.languages.slice();
                languages[index] = { ...item, written: e.target.value };
                patchExtended({ languages });
              }}
            >
              <option value="">Written</option>
              {LANGUAGE_PROFICIENCY.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </div>
        ))}
        <button type="button" className="text-sm text-accent" onClick={() => patchExtended({ languages: [...draft.extended.languages, emptyLanguage()] })}>
          Add language
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium">References</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-accent"
            checked={draft.extended.references_on_request}
            onChange={(e) => patchExtended({ references_on_request: e.target.checked })}
          />
          References available upon request
        </label>
        {draft.extended.references.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
            <input className={fieldClass} placeholder="Name" value={item.name} onChange={(e) => {
              const references = draft.extended.references.slice();
              references[index] = { ...item, name: e.target.value };
              patchExtended({ references });
            }} />
            <input className={fieldClass} placeholder="Job title" value={item.title} onChange={(e) => {
              const references = draft.extended.references.slice();
              references[index] = { ...item, title: e.target.value };
              patchExtended({ references });
            }} />
            <input className={fieldClass} placeholder="Organisation" value={item.organisation} onChange={(e) => {
              const references = draft.extended.references.slice();
              references[index] = { ...item, organisation: e.target.value };
              patchExtended({ references });
            }} />
            <input className={fieldClass} placeholder="Relationship" value={item.relationship} onChange={(e) => {
              const references = draft.extended.references.slice();
              references[index] = { ...item, relationship: e.target.value };
              patchExtended({ references });
            }} />
            <input className={fieldClass} placeholder="Email" value={item.email} onChange={(e) => {
              const references = draft.extended.references.slice();
              references[index] = { ...item, email: e.target.value };
              patchExtended({ references });
            }} />
            <input className={fieldClass} placeholder="Phone" value={item.phone} onChange={(e) => {
              const references = draft.extended.references.slice();
              references[index] = { ...item, phone: e.target.value };
              patchExtended({ references });
            }} />
          </div>
        ))}
        <button type="button" className="text-sm text-accent" onClick={() => patchExtended({ references: [...draft.extended.references, emptyReference()] })}>
          Add reference
        </button>
      </section>
    </div>
  );
}

function PrivacyTab({
  draft,
  patch,
  patchExtended,
}: {
  draft: ProfileDraft;
  patch: (partial: Partial<ProfileDraft>) => void;
  patchExtended: (partial: Partial<ProfileExtended>) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-base font-medium">Accuracy and AI</h2>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-accent"
            checked={draft.accuracy_confirmed}
            onChange={(e) => patch({ accuracy_confirmed: e.target.checked })}
          />
          I confirm the information in this profile is accurate and that Fieldwork must not invent missing facts.
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-accent"
            checked={draft.extended.ai_processing_ok}
            onChange={(e) => patchExtended({ ai_processing_ok: e.target.checked })}
          />
          Allow AI to draft documents and answers from this confirmed profile. I will review anything before it is sent.
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-accent"
            checked={draft.extended.document_share_ok}
            onChange={(e) => patchExtended({ document_share_ok: e.target.checked })}
          />
          Allow my documents to be attached when I approve an application.
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-accent"
            checked={draft.digest_email}
            onChange={(e) => patch({ digest_email: e.target.checked })}
          />
          Daily email digest of top eligible matches (Pro plan).
        </label>
      </section>
      <section className="space-y-3 text-sm">
        <h2 className="text-base font-medium">Privacy and data</h2>
        <p>
          <a href="/privacy" className="underline underline-offset-4">
            Privacy notice
          </a>
        </p>
        <p className="text-muted">
          Application automation stays on the Auto-apply page. The default is review-before-submit. Fully unattended
          submission is never enabled by default.
        </p>
        <p>
          <a href="/dashboard/auto-apply" className="underline underline-offset-4">
            Application automation preferences
          </a>
        </p>
        <form action={deleteAccount}>
          <button type="submit" className="text-sm text-warn underline-offset-4 hover:underline">
            Delete my account and data
          </button>
        </form>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2"
          onClick={async () => {
            const data = await exportMyData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "fieldwork-data-export.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download my data
        </button>
      </section>
    </div>
  );
}
