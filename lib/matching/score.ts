export const QUALIFICATION_LEVELS = [
  "matric",
  "certificate",
  "diploma",
  "bachelors",
  "honours",
  "masters",
  "doctorate",
] as const;

export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

export const SCORE_WEIGHTS = {
  qualifications: 0.3,
  skills: 0.3,
  experience: 0.2,
  location: 0.1,
  preferences: 0.1,
} as const;

export type ScoreProfile = {
  location: string | null;
  skills: string[];
  yearsExperience: number | null;
  qualifications: { level: string | null; name: string | null }[];
  education: { qualification: string | null; level: string | null }[];
  preferences: {
    roles: string[];
    locations: string[];
    workModes: string[];
    openToRelocate: boolean;
  };
};

export type ScoreJob = {
  title: string;
  city: string | null;
  province: string | null;
  location: string | null;
  workMode: string;
  minQualification: string | null;
  minYearsExperience: number | null;
  skills: string[];
};

export type ScoreBreakdown = {
  qualifications: number;
  skills: number;
  experience: number;
  location: number;
  preferences: number;
  weights: typeof SCORE_WEIGHTS;
  matchedSkills: string[];
  missingSkills: string[];
};

export type ScoreResult = {
  score: number;
  eligibilityPass: boolean;
  eligibilityReasons: string[];
  breakdown: ScoreBreakdown;
};

const LEVEL_ALIASES: Record<string, QualificationLevel> = {
  matric: "matric",
  "grade 12": "matric",
  nsc: "matric",
  certificate: "certificate",
  cert: "certificate",
  diploma: "diploma",
  "national diploma": "diploma",
  bachelor: "bachelors",
  bachelors: "bachelors",
  "bachelor s": "bachelors",
  degree: "bachelors",
  bsc: "bachelors",
  "b sc": "bachelors",
  ba: "bachelors",
  bcom: "bachelors",
  "b com": "bachelors",
  honours: "honours",
  honors: "honours",
  hons: "honours",
  masters: "masters",
  master: "masters",
  "master s": "masters",
  msc: "masters",
  mba: "masters",
  doctorate: "doctorate",
  doctoral: "doctorate",
  phd: "doctorate",
  "ph d": "doctorate",
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeLevel(value: string | null | undefined): QualificationLevel | null {
  const key = normalizeText(value);
  if (!key) return null;
  return LEVEL_ALIASES[key] ?? null;
}

function levelRank(level: QualificationLevel | null) {
  if (!level) return -1;
  return QUALIFICATION_LEVELS.indexOf(level);
}

function highestLevel(profile: ScoreProfile) {
  const candidates = [
    ...profile.education.flatMap((item) => [item.level, item.qualification]),
    ...profile.qualifications.flatMap((item) => [item.level, item.name]),
  ];
  return candidates.reduce<QualificationLevel | null>((best, value) => {
    const level = normalizeLevel(value);
    if (!level) return best;
    return levelRank(level) > levelRank(best) ? level : best;
  }, null);
}

function mentions(text: string | null | undefined, place: string | null | undefined) {
  const haystack = normalizeText(text);
  const needle = normalizeText(place);
  if (!haystack || !needle) return false;
  return haystack.includes(needle);
}

function placeMatches(profile: ScoreProfile, place: string | null) {
  if (!place) return false;
  if (mentions(profile.location, place)) return true;
  return profile.preferences.locations.some((location) => mentions(location, place) || mentions(place, location));
}

export function scoreJob(profile: ScoreProfile, job: ScoreJob): ScoreResult {
  const reasons: string[] = [];
  const candidateLevel = highestLevel(profile);
  const requiredLevel = normalizeLevel(job.minQualification);

  let qualifications = 100;
  if (requiredLevel) {
    const gap = levelRank(candidateLevel) - levelRank(requiredLevel);
    if (candidateLevel && gap >= 0) {
      qualifications = 100;
    } else if (candidateLevel && gap === -1) {
      qualifications = 50;
      reasons.push(
        `Asks for ${requiredLevel}; your confirmed qualification is ${candidateLevel}.`,
      );
    } else {
      qualifications = 0;
      reasons.push(
        candidateLevel
          ? `Asks for ${requiredLevel}; your confirmed qualification is ${candidateLevel}.`
          : `Asks for ${requiredLevel}, and your confirmed profile has no recognised qualification.`,
      );
    }
  }

  const requiredSkills = job.skills.map((skill) => skill.trim()).filter(Boolean);
  const profileSkills = new Set(profile.skills.map((skill) => normalizeText(skill)).filter(Boolean));
  const matchedSkills = requiredSkills.filter((skill) => profileSkills.has(normalizeText(skill)));
  const missingSkills = requiredSkills.filter((skill) => !profileSkills.has(normalizeText(skill)));
  const skills = requiredSkills.length === 0 ? 100 : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  const minimumYears = job.minYearsExperience ?? 0;
  let experience = 100;
  if (minimumYears > 0) {
    if (profile.yearsExperience == null) {
      experience = 0;
      reasons.push(`Asks for ${minimumYears} years of experience, which is not on your confirmed profile.`);
    } else if (profile.yearsExperience < minimumYears) {
      experience = Math.round((profile.yearsExperience / minimumYears) * 100);
      reasons.push(
        `Asks for ${minimumYears} years of experience; your confirmed profile has ${profile.yearsExperience}.`,
      );
    }
  }

  let location = 0;
  const remote = job.workMode === "remote";
  const cityMatch = placeMatches(profile, job.city);
  const provinceMatch = placeMatches(profile, job.province);
  if (remote) {
    location = 100;
  } else if (cityMatch) {
    location = 100;
  } else if (provinceMatch) {
    location = 70;
  } else if (profile.preferences.openToRelocate) {
    location = 40;
  }

  if (job.workMode === "on_site" && !remote && !cityMatch && !provinceMatch && !profile.preferences.openToRelocate) {
    const where = [job.city, job.province].filter(Boolean).join(", ");
    reasons.push(
      where
        ? `On-site in ${where}, outside the location on your confirmed profile.`
        : "On-site role is outside the location on your confirmed profile.",
    );
  }

  const preferredModes = profile.preferences.workModes;
  const modeScore =
    preferredModes.length === 0 || preferredModes.includes(job.workMode) ? 100 : 0;
  const preferredRoles = profile.preferences.roles.map((role) => normalizeText(role)).filter(Boolean);
  const title = normalizeText(job.title);
  const roleScore =
    preferredRoles.length === 0 || preferredRoles.some((role) => title.includes(role)) ? 100 : 0;
  const preferences = Math.round((modeScore + roleScore) / 2);

  const score = Math.round(
    (qualifications * SCORE_WEIGHTS.qualifications +
      skills * SCORE_WEIGHTS.skills +
      experience * SCORE_WEIGHTS.experience +
      location * SCORE_WEIGHTS.location +
      preferences * SCORE_WEIGHTS.preferences) *
      10,
  ) / 10;

  const eligibilityPass = reasons.length === 0;
  return {
    score,
    eligibilityPass,
    eligibilityReasons: eligibilityPass
      ? ["Meets the qualification, experience, and location checks on your confirmed profile."]
      : reasons,
    breakdown: {
      qualifications,
      skills,
      experience,
      location,
      preferences,
      weights: SCORE_WEIGHTS,
      matchedSkills,
      missingSkills,
    },
  };
}
