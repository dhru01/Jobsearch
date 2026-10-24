import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { inferMinQualification, inferMinYears, inferWorkMode } from "@/lib/jobs/extract";

describe("job extractors", () => {
  it("detects honours requirements", () => {
    assert.equal(inferMinQualification("Honours degree in statistics required"), "honours");
  });

  it("detects minimum years", () => {
    assert.equal(inferMinYears("Minimum of 3 years experience in JavaScript"), 3);
  });

  it("detects remote work mode", () => {
    assert.equal(inferWorkMode("Fully remote role for South Africa"), "remote");
  });
});
