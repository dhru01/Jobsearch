import type { CandidateProfile } from "@/lib/profile";
import type { ProfileInput } from "@/lib/validation/profile";
import { scoreJob, type ScoreJob } from "@/lib/matching/score";
import type { NormalizedJob } from "@/lib/jobs/types";
import { toScoreProfile } from "@/lib/profile";

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

function jobTextBlob(job: NormalizedJob) {
  return normalizeToken(
    [job.title, job.description, job.requirements, ...job.skills].filter(Boolean).join(" "),
  );
}

function tokenMentioned(blob: string, token: string) {
  const needle = normalizeToken(token);
  if (needle.length < 2) return false;
  if (blob.includes(needle)) return true;
  const parts = needle.split(" ").filter((part) => part.length >= 3);
  return parts.length > 0 && parts.every((part) => blob.includes(part));
}

function toScoreJob(job: NormalizedJob): ScoreJob {
  return {
    title: job.title,
    city: job.city,
    province: job.province,
    location: job.location,
    workMode: job.work_mode,
    minQualification: job.min_qualification,
    minYearsExperience: job.min_years_experience,
    skills: job.skills,
  };
}

/** PNet Actor search terms derived from a confirmed candidate profile. */
export function buildPnetSearchFromProfile(profile: CandidateProfile) {
  const roles = profile.preferences.roles.map((role) => role.trim()).filter(Boolean);
  const skills = profile.skills.map((skill) => skill.trim()).filter(Boolean);
  const headline = profile.headline?.trim() ?? "";
  const educationField = profile.education.map((item) => item.field.trim()).find(Boolean);
  const qualificationName =
    profile.education.map((item) => item.qualification.trim()).find(Boolean) ||
    profile.qualifications.map((item) => item.name.trim()).find(Boolean);

  const keywordParts: string[] = [];
  if (roles[0]) keywordParts.push(roles[0]);
  else if (headline) keywordParts.push(headline);

  for (const skill of skills.slice(0, 4)) {
    if (!keywordParts.some((part) => part.toLowerCase().includes(skill.toLowerCase()))) {
      keywordParts.push(skill);
    }
  }

  if (educationField && keywordParts.join(" ").length < 50) keywordParts.push(educationField);
  if (qualificationName && keywordParts.join(" ").length < 60) keywordParts.push(qualificationName);

  let keyword = keywordParts.join(" ").replace(/\s+/g, " ").trim();
  if (keyword.length > 120) keyword = keyword.slice(0, 120).trim();

  if (!keyword) {
    keyword = process.env.APIFY_PNET_KEYWORD?.trim() || "graduate";
  }

  const location =
    profile.preferences.locations.find((item) => item.trim())?.trim() ||
    profile.location?.split(",")[0]?.trim() ||
    process.env.APIFY_PNET_LOCATION?.trim() ||
    "";

  return { keyword, location };
}

/**
 * True when a normalized job overlaps the profile's skills, roles, qualifications, or scoring signals.
 */
export function jobRelevantToProfile(job: NormalizedJob, input: ProfileInput) {
  const blob = jobTextBlob(job);
  const profile = toScoreProfile(input);
  const scored = scoreJob(profile, toScoreJob(job));

  if (scored.breakdown.matchedSkills.length > 0) return true;

  if (input.skills.some((skill) => tokenMentioned(blob, skill))) return true;

  if (input.preferences.roles.some((role) => tokenMentioned(blob, role) || tokenMentioned(normalizeToken(job.title), role))) {
    return true;
  }

  if (headlineMentioned(job, input.headline)) return true;

  if (input.qualifications.some((item) => item.name && tokenMentioned(blob, item.name))) return true;

  if (input.education.some((item) => {
    if (item.qualification && tokenMentioned(blob, item.qualification)) return true;
    if (item.field && tokenMentioned(blob, item.field)) return true;
    return false;
  })) {
    return true;
  }

  if (scored.score >= 45 && scored.breakdown.qualifications >= 50) return true;

  return false;
}

function headlineMentioned(job: NormalizedJob, headline: string | null | undefined) {
  const h = headline?.trim();
  if (!h) return false;
  const title = normalizeToken(job.title);
  const words = normalizeToken(h).split(" ").filter((word) => word.length >= 4);
  return words.length > 0 && words.some((word) => title.includes(word));
}
