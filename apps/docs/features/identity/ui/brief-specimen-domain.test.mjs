import assert from "node:assert/strict";
import test from "node:test";

import { isSpecimenDomain, specimenBriefFromThread, specimenDomainFromBrief } from "./brief-specimen-domain.ts";

test("specimenBriefFromThread keeps the first user turn for specimen routing", () => {
  assert.equal(
    specimenBriefFromThread(
      [
        { role: "user", text: "A SaaS dashboard" },
        { role: "assistant", text: "Done" },
        { role: "user", text: "Calmer" },
      ],
      "fallback",
    ),
    "A SaaS dashboard",
  );
  assert.equal(specimenBriefFromThread([], "fallback"), "fallback");
});

test("specimenDomainFromBrief maps brief keywords to the four kit domains", () => {
  assert.equal(specimenDomainFromBrief("A ceramics shop"), "commerce");
  assert.equal(specimenDomainFromBrief("SaaS dashboard for admins"), "saas-dashboard");
  assert.equal(specimenDomainFromBrief("Independent newsroom"), "editorial");
  assert.equal(specimenDomainFromBrief("Clinic booking for a neighbourhood practice"), "service-booking");
  assert.equal(specimenDomainFromBrief(""), "saas-dashboard");
});

test("isSpecimenDomain accepts only the four kit domain ids", () => {
  assert.equal(isSpecimenDomain("editorial"), true);
  assert.equal(isSpecimenDomain("service-booking"), true);
  assert.equal(isSpecimenDomain("booking"), false);
  assert.equal(isSpecimenDomain("newspaper"), false);
  assert.equal(isSpecimenDomain(null), false);
});
