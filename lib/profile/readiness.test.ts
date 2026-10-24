import assert from "node:assert/strict";
import test from "node:test";
import { draftFromProfile, normalizeProfile } from "@/lib/profile";
import { profileReadiness } from "@/lib/profile/readiness";

test("profileReadiness treats core contact fields as mandatory", () => {
  const profile = normalizeProfile({
    id: "1",
    user_id: "u1",
    full_name: "Thabo Ndlovu",
    first_name: "Thabo",
    last_name: "Ndlovu",
    email: "thabo@example.com",
    phone: "+27821234567",
    city: "Johannesburg",
    province: "Gauteng",
    country: "ZA",
    nationality: "South African",
    headline: "Graduate",
    skills: ["Excel"],
    education: [{ institution: "Wits", qualification: "BCom" }],
    preferences: { roles: ["analyst"], work_modes: ["hybrid"] },
    extraction_status: "confirmed",
  });
  const draft = draftFromProfile(profile, "thabo@example.com");
  draft.extended.date_of_birth = "1998-05-12";
  draft.extended.race = "African";
  const readiness = profileReadiness(draft, {
    hasCv: false,
    identityDocumentsComplete: false,
    identityMissing: ["Choose SA ID card or passport and upload the required documents"],
  });
  assert.equal(readiness.tabs.find((tab) => tab.id === "personal")?.complete, true);
  assert.equal(readiness.tabs.find((tab) => tab.id === "documents")?.complete, false);
  assert.ok(readiness.messages.some((message) => /CV/i.test(message)));
});
