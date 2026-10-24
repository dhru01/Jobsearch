import assert from "node:assert/strict";
import { test } from "node:test";
import { mapLinkedInItemToRawListing } from "@/lib/jobs/sources/linkedin-listing-map";

test("mapLinkedInItemToRawListing maps core fields", () => {
  const row = mapLinkedInItemToRawListing({
    job_id: "1",
    job_url: "https://www.linkedin.com/jobs/view/1",
    job_title: "Intern",
    company_name: "Co",
    location: "Cape Town, South Africa",
    employment_type: "Full-time",
    salary_range: "R200 000 - R300 000",
    job_description: "Learn and build.",
  });
  assert.ok(row);
  assert.equal(row?.source, "linkedin");
  assert.equal(row?.salaryText, "R200 000 - R300 000");
});
