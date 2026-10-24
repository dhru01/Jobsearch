import assert from "node:assert/strict";
import test from "node:test";
import { formatScore, roundScoreDisplay } from "@/lib/labels";

test("roundScoreDisplay rounds up to the nearest 5", () => {
  assert.equal(roundScoreDisplay(79.9), 80);
  assert.equal(roundScoreDisplay(80), 80);
  assert.equal(roundScoreDisplay(81), 85);
  assert.equal(roundScoreDisplay(0), 0);
  assert.equal(roundScoreDisplay(100), 100);
  assert.equal(roundScoreDisplay(100.2), 100);
});

test("formatScore returns whole multiples of 5", () => {
  assert.equal(formatScore(79.9), "80");
  assert.equal(formatScore(92.5), "95");
});
