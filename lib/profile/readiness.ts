import type { ProfileTabId } from "@/lib/profile/constants";
import type { ProfileExtended } from "@/lib/profile/extended";
import type { ProfileDraft } from "@/lib/profile";

export type TabReadiness = {
  id: ProfileTabId;
  label: string;
  complete: boolean;
  missing: string[];
};

function filled(value: string | undefined | null) {
  return Boolean(value?.trim());
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function looksLikePhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  return /^\+?[0-9]{9,15}$/.test(compact);
}

export function formatSaPhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(compact)) return `+27${compact.slice(1)}`;
  if (/^27\d{9}$/.test(compact)) return `+${compact}`;
  return value.trim();
}

export function tabReadiness(
  draft: ProfileDraft,
  extras: { hasCv: boolean; identityDocumentsComplete: boolean; identityMissing: string[] },
): TabReadiness[] {
  const ext = draft.extended;
  const personalMissing = [
    !filled(draft.first_name) && "First name",
    !filled(draft.last_name) && "Last name",
    !looksLikeEmail(draft.email) && "Valid email",
    !looksLikePhone(draft.phone) && "Mobile phone",
    !filled(draft.city) && "City",
    !filled(draft.province) && "Province",
    !filled(draft.country) && "Country",
    !filled(draft.nationality) && "Nationality",
    !filled(draft.extended.date_of_birth) && "Date of birth",
    !filled(draft.extended.race) && "Race",
  ].filter(Boolean) as string[];

  const professionalMissing = [
    !filled(draft.headline) && "Headline",
    !filled(draft.skills) &&
      ext.structured_skills.every((skill) => !skill.name.trim()) &&
      "At least one skill",
  ].filter(Boolean) as string[];

  const educationComplete = draft.education.some(
    (item) => filled(item.institution) && filled(item.qualification),
  );
  const experienceComplete =
    ext.no_formal_experience ||
    draft.experience.some((item) => filled(item.title) && filled(item.organisation));

  const questionsComplete = Object.values(ext.standard_answers).some((value) => filled(value));
  const additionalComplete =
    ext.languages.some((item) => filled(item.language)) || ext.references_on_request;

  return [
    { id: "personal", label: "Personal Details", complete: personalMissing.length === 0, missing: personalMissing },
    { id: "professional", label: "Professional Profile", complete: professionalMissing.length === 0, missing: professionalMissing },
    {
      id: "education",
      label: "Education",
      complete: educationComplete,
      missing: educationComplete ? [] : ["At least one qualification"],
    },
    {
      id: "experience",
      label: "Work Experience",
      complete: experienceComplete,
      missing: experienceComplete ? [] : ["Add experience or mark no formal work experience"],
    },
    {
      id: "documents",
      label: "Documents",
      complete: extras.hasCv && extras.identityDocumentsComplete,
      missing: [
        ...(extras.hasCv ? [] : ["Upload a CV (required)"]),
        ...extras.identityMissing,
      ],
    },
    {
      id: "questions",
      label: "Application Questions",
      complete: questionsComplete,
      missing: questionsComplete ? [] : ["Save at least one reusable answer"],
    },
    {
      id: "additional",
      label: "Additional Information",
      complete: additionalComplete,
      missing: additionalComplete ? [] : ["Add a language or confirm references on request"],
    },
    { id: "privacy", label: "Privacy & Settings", complete: Boolean(draft.accuracy_confirmed), missing: draft.accuracy_confirmed ? [] : ["Confirm your information is accurate"] },
  ];
}

export function profileReadiness(
  draft: ProfileDraft,
  extras: { hasCv: boolean; identityDocumentsComplete: boolean; identityMissing: string[] },
) {
  const tabs = tabReadiness(draft, extras);
  const core = tabs.find((tab) => tab.id === "personal");
  const matchingTabs = tabs.filter((tab) =>
    ["personal", "professional", "education", "documents"].includes(tab.id),
  );
  const applicationTabs = tabs.filter((tab) =>
    ["personal", "professional", "education", "experience", "documents", "privacy"].includes(tab.id),
  );
  const completeCount = tabs.filter((tab) => tab.complete).length;
  return {
    tabs,
    percent: Math.round((completeCount / tabs.length) * 100),
    basicReady: Boolean(core?.complete),
    matchingReady: matchingTabs.every((tab) => tab.complete),
    applicationReady: applicationTabs.every((tab) => tab.complete),
    messages: readinessMessages(draft, extras, tabs),
  };
}

function readinessMessages(
  draft: ProfileDraft,
  extras: { hasCv: boolean; identityDocumentsComplete: boolean; identityMissing: string[] },
  tabs: TabReadiness[],
) {
  const messages: string[] = [];
  if (
    tabs.find((tab) => tab.id === "professional")?.complete &&
    tabs.find((tab) => tab.id === "documents")?.complete
  ) {
    messages.push("Your profile is ready for job matching.");
  }
  if (!extras.hasCv) {
    messages.push("Upload a CV on the Documents tab — it is required to complete your profile.");
  }
  if (!extras.identityDocumentsComplete) {
    messages.push("Complete identity documents on the Documents tab (SA ID card or passport).");
  }
  if (!draft.work_authorisation.trim() && !draft.extended.standard_answers.authorised_to_work?.trim()) {
    messages.push("This employer may require information about your work authorisation.");
  }
  if (!draft.min_salary.trim()) {
    messages.push("Add an expected salary if an employer asks for it. This is optional until then.");
  }
  if (!draft.accuracy_confirmed) {
    messages.push("Confirm that your information is accurate before applications use this profile.");
  }
  return messages;
}

export function mergeSkillsForMatching(draft: { skills: string; extended: ProfileExtended }) {
  const named = draft.skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const structured = draft.extended.structured_skills.map((item) => item.name.trim()).filter(Boolean);
  return [...new Set([...named, ...structured])];
}
