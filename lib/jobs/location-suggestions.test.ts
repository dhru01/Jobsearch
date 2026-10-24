import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterLocationSuggestions } from "./location-suggestions.ts";

describe("filterLocationSuggestions", () => {
  it("returns popular locations when the query is empty", () => {
    const results = filterLocationSuggestions("");
    assert.ok(results.includes("South Africa"));
    assert.ok(results.includes("Johannesburg"));
  });

  it("ranks prefix matches ahead of substring matches", () => {
    const results = filterLocationSuggestions("cap");
    assert.equal(results[0], "Cape Town");
  });
});
