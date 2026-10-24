import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { provinceNameFromCode } from "./sa-province-codes.ts";

describe("geonames locations", () => {
  it("maps Gauteng province code 6", () => {
    assert.equal(provinceNameFromCode(6), "Gauteng");
  });
});
