import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSouthAfricanListing, normalizeSouthAfricanLocation } from "@/lib/jobs/location";

describe("normalizeSouthAfricanLocation", () => {
  it("maps Cape Town to Western Cape", () => {
    const result = normalizeSouthAfricanLocation("Cape Town, Western Cape");
    assert.equal(result.city, "Cape Town");
    assert.equal(result.province, "Western Cape");
  });

  it("treats remote South Africa as remote", () => {
    const result = normalizeSouthAfricanLocation("Remote — South Africa");
    assert.equal(result.city, "Remote");
    assert.equal(result.province, null);
  });
});

describe("isSouthAfricanListing", () => {
  it("accepts listings with a province", () => {
    assert.equal(isSouthAfricanListing("Johannesburg, Gauteng", ""), true);
  });

  it("rejects unrelated countries", () => {
    assert.equal(isSouthAfricanListing("London, UK", "Work in London office"), false);
  });
});
