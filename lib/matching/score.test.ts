import assert from "node:assert/strict";
import test from "node:test";
import { scoreJob, type ScoreJob, type ScoreProfile } from "./score.ts";

const graduate: ScoreProfile = {
  location: "Cape Town",
  skills: ["JavaScript", "React", "Git"],
  yearsExperience: 0,
  qualifications: [],
  education: [{ qualification: "BSc Computer Science", level: "bachelors" }],
  preferences: {
    roles: ["developer"],
    locations: ["Cape Town"],
    workModes: ["hybrid", "remote"],
    openToRelocate: false,
  },
};

const capeTownRole: ScoreJob = {
  title: "Graduate Software Developer",
  city: "Cape Town",
  province: "Western Cape",
  location: "Cape Town, Western Cape",
  workMode: "hybrid",
  minQualification: "bachelors",
  minYearsExperience: 0,
  skills: ["JavaScript", "React", "Git", "HTML"],
};

test("a matching graduate passes and scores the stated weights", () => {
  const result = scoreJob(graduate, capeTownRole);
  assert.equal(result.eligibilityPass, true);
  assert.equal(result.breakdown.qualifications, 100);
  assert.equal(result.breakdown.skills, 75);
  assert.equal(result.breakdown.experience, 100);
  assert.equal(result.breakdown.location, 100);
  assert.equal(result.breakdown.preferences, 100);
  assert.equal(result.score, 92.5);
  assert.deepEqual(result.breakdown.missingSkills, ["HTML"]);
});

test("on-site work outside the confirmed location fails eligibility", () => {
  const result = scoreJob(graduate, {
    ...capeTownRole,
    title: "Platform Engineer",
    city: "Johannesburg",
    province: "Gauteng",
    location: "Johannesburg, Gauteng",
    workMode: "on_site",
    minQualification: "honours",
    minYearsExperience: 5,
    skills: ["Kubernetes"],
  });
  assert.equal(result.eligibilityPass, false);
  assert.ok(result.eligibilityReasons.some((reason) => reason.includes("honours")));
  assert.ok(result.eligibilityReasons.some((reason) => reason.includes("5 years")));
  assert.ok(result.eligibilityReasons.some((reason) => reason.includes("Johannesburg")));
});

test("education level alone drives qualification matching", () => {
  const result = scoreJob(
    {
      ...graduate,
      education: [{ qualification: "Diploma in Supply Chain", level: "diploma" }],
    },
    { ...capeTownRole, minQualification: "diploma" },
  );
  assert.equal(result.breakdown.qualifications, 100);
});

test("remote roles do not fail the location check", () => {
  const result = scoreJob(graduate, {
    ...capeTownRole,
    city: "Remote",
    province: null,
    location: "Remote — South Africa",
    workMode: "remote",
  });
  assert.equal(result.eligibilityPass, true);
  assert.equal(result.breakdown.location, 100);
});
