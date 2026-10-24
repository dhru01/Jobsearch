import assert from "node:assert/strict";
import test from "node:test";
import {
  apifySearchKeywords,
  buildApifySearchFromFilters,
} from "@/lib/jobs/apify-search-from-filters";
import type { CandidateProfile } from "@/lib/profile";

const profile = {
  headline: "",
  location: "Johannesburg",
  skills: [],
  qualifications: [],
  education: [],
  preferences: {
    roles: ["software engineer"],
    locations: ["Gauteng"],
    employment_types: [],
    remote: false,
    min_salary: null,
  },
} as CandidateProfile;

test("buildApifySearchFromFilters uses form title and location", () => {
  const search = buildApifySearchFromFilters(
    { q: "data analyst", location: "Cape Town, Western Cape", employment: [] },
    profile,
  );
  assert.equal(search.keyword, "data analyst");
  assert.equal(search.location, "Cape Town, Western Cape");
  assert.equal(search.employments, undefined);
});

test("buildApifySearchFromFilters keeps multiple employment types", () => {
  const search = buildApifySearchFromFilters(
    { q: "developer", location: "", employment: ["internship", "learnership"] },
    profile,
  );
  assert.deepEqual(search.employments, ["internship", "learnership"]);
});

test("apifySearchKeywords returns one query per employment type", () => {
  const keywords = apifySearchKeywords({
    keyword: "developer",
    location: "Johannesburg",
    employments: ["internship", "learnership"],
  });
  assert.deepEqual(keywords, ["developer internship", "developer learnership"]);
});

test("apifySearchKeywords does not duplicate employment already in title", () => {
  const keywords = apifySearchKeywords({
    keyword: "graduate developer",
    location: "Johannesburg",
    employments: ["graduate", "internship"],
  });
  assert.deepEqual(keywords, ["graduate developer", "graduate developer internship"]);
});
