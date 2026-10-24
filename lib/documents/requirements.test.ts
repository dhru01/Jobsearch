import assert from "node:assert/strict";
import test from "node:test";
import { jobDocumentRequirements, userHasCv } from "./requirements.ts";

test("graduate role lists CV and degree documents", () => {
  const docs = [
    {
      id: "1",
      kind: "cv",
      slot: "cv",
      file_name: "cv.pdf",
      description: null,
      metadata: {},
    },
    {
      id: "2",
      kind: "qualification",
      slot: "bachelors_certificate",
      file_name: "degree.pdf",
      description: null,
      metadata: {},
    },
  ];
  assert.equal(userHasCv(docs), true);
  const reqs = jobDocumentRequirements({ title: "Graduate Business Analyst", min_qualification: "bachelors" }, docs);
  assert.ok(reqs.find((item) => item.label.includes("Degree certificate"))?.status === "available");
  assert.ok(reqs.find((item) => item.label.includes("Academic transcript"))?.status === "missing");
});
