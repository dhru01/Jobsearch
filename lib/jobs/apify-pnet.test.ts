import assert from "node:assert/strict";
import test from "node:test";
import { mapPnetItemToRawListing } from "@/lib/jobs/sources/pnet-listing-map";

test("mapPnetItemToRawListing maps core fields", () => {
  const row = mapPnetItemToRawListing({
    job_id: "123",
    title: "Junior Developer",
    job_url: "https://www.pnet.co.za/jobs--Junior-Developer--123-inline.html",
    company: "Example Co",
    location: "Cape Town, Western Cape",
    description_text: "Build web apps.",
    skills: ["JavaScript", "React"],
    job_category: "Information Technology",
  });

  assert.ok(row);
  assert.equal(row?.source, "pnet");
  assert.equal(row?.sourceId, "123");
  assert.equal(row?.title, "Junior Developer");
  assert.match(row?.requirements ?? "", /JavaScript/);
});

test("mapPnetItemToRawListing rejects missing url", () => {
  assert.equal(mapPnetItemToRawListing({ title: "Role" }), null);
});
