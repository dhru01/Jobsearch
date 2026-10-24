import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPlaceName } from "./geonames-locations.ts";

describe("location autocomplete", () => {
  it("shortens district municipality names", () => {
    assert.equal(formatPlaceName("John Taolo Gaetsewe District Municipality"), "John Taolo Gaetsewe");
  });
});
