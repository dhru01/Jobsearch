import type { CandidateProfile } from "@/lib/profile";
import type { TailoredCv } from "@/lib/documents/tailored-types";

type JobContext = {
  title: string;
  company: string;
  skills: string[];
  description: string;
};

function rankSkills(profileSkills: string[], jobSkills: string[]) {
  const jobSet = new Set(jobSkills.map((skill) => skill.toLowerCase()));
  const matched: string[] = [];
  const rest: string[] = [];
  for (const skill of profileSkills) {
    if (jobSet.has(skill.toLowerCase())) matched.push(skill);
    else rest.push(skill);
  }
  return [...matched, ...rest];
}

/** Deterministic CV draft from confirmed profile facts (no LLM). */
export function profileToTailoredCv(profile: CandidateProfile, job: JobContext): TailoredCv {
  const roleHint = job.title.trim();
  const headline =
    profile.headline?.trim() ||
    (roleHint ? `Candidate interested in ${roleHint}` : "Early-career professional");

  let summary = profile.summary?.trim() ?? "";
  if (roleHint && summary) {
    summary = `${summary} Applying for ${roleHint} at ${job.company}.`;
  } else if (roleHint) {
    summary = `Applying for ${roleHint} at ${job.company}.`;
  }

  return {
    full_name: profile.full_name?.trim() ?? "Candidate",
    email: profile.email?.trim() ?? "",
    phone: profile.phone?.trim() ?? "",
    location: profile.location?.trim() ?? "",
    headline,
    summary,
    skills: rankSkills(profile.skills, job.skills),
    experience: profile.experience.map((item) => ({
      title: item.title,
      organisation: item.organisation,
      start: item.start,
      end: item.end,
      summary: item.summary,
    })),
    education: profile.education.map((item) => ({
      institution: item.institution,
      qualification: item.qualification,
      field: item.field,
      end_year: item.end_year,
    })),
    qualifications: profile.qualifications.map((item) => ({
      name: item.name,
      level: item.level,
    })),
  };
}

export function templateCoverLetter(profile: CandidateProfile, job: JobContext) {
  const name = profile.full_name?.trim() || "Candidate";
  const lines = [
    `Dear ${job.company} hiring team,`,
    "",
    `I am writing to apply for the ${job.title} role. My confirmed profile highlights ${profile.skills.slice(0, 6).join(", ") || "relevant skills"} and ${profile.years_experience ?? 0} years of experience where stated on my profile.`,
    profile.summary?.trim() ? profile.summary.trim() : "",
    "",
    "I have reviewed this letter against my confirmed Fieldwork profile. Please find my tailored CV attached.",
    "",
    name,
    profile.email?.trim() ?? "",
    profile.phone?.trim() ?? "",
  ].filter((line, index, all) => line !== "" || (index > 0 && all[index - 1] !== ""));
  return lines.join("\n");
}
