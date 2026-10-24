import assert from "node:assert/strict";
import { test } from "node:test";
import { mapIndeedItemToRawListing } from "@/lib/jobs/sources/indeed-listing-map";

test("mapIndeedItemToRawListing builds za URL and employment", () => {
  const row = mapIndeedItemToRawListing(
    {
      id: "abc123",
      title: "Graduate Developer",
      viewJobLink: "/viewjob?jk=abc123",
      companyDetails: { name: "Acme" },
      formattedLocation: "Johannesburg, Gauteng",
      jobDescription: "Build software.",
      jobTypes: ["Full-time"],
    },
    "za",
  );
  assert.ok(row);
  assert.equal(row?.source, "indeed");
  assert.match(row?.originalUrl, /^https:\/\/za\.indeed\.com/);
  assert.equal(row?.employmentType, "Full-time");
});
