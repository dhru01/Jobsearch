import assert from "node:assert/strict";
import test from "node:test";
import { shouldSuggestNameSplit, suggestNameSplit } from "@/lib/profile/name-split";

test("suggestNameSplit splits a two-part legal name", () => {
  assert.deepEqual(suggestNameSplit("Thabo Ndlovu"), { first_name: "Thabo", last_name: "Ndlovu" });
});

test("shouldSuggestNameSplit only when first and last are empty", () => {
  assert.equal(shouldSuggestNameSplit({ full_name: "Thabo Ndlovu", first_name: "", last_name: "" }), true);
  assert.equal(shouldSuggestNameSplit({ full_name: "Thabo Ndlovu", first_name: "Thabo", last_name: "" }), false);
});
