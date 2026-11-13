import assert from "node:assert/strict";
import test from "node:test";

import {
  coercePersistedSpecimenDomain,
  isSpecimenDomain,
  specimenBriefFromThread,
  specimenDomainFromBrief,
} from "../lib/brief-specimen-domain.ts";

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

test("specimenDomainFromBrief maps briefs through the kit scorer", () => {
  assert.equal(specimenDomainFromBrief("A ceramics shop with warm neutrals"), "commerce");
  assert.equal(specimenDomainFromBrief("B2B admin with usage quotas"), "saas-dashboard");
  assert.equal(specimenDomainFromBrief("Independent magazine newsroom"), "editorial");
  assert.equal(specimenDomainFromBrief("Clinic schedule and reservations"), "service-booking");
  assert.equal(specimenDomainFromBrief(""), "saas-dashboard");
});

test("isSpecimenDomain accepts only the four kit domain ids", () => {
  assert.equal(isSpecimenDomain("editorial"), true);
  assert.equal(isSpecimenDomain("service-booking"), true);
  assert.equal(isSpecimenDomain("booking"), false);
  assert.equal(isSpecimenDomain("newspaper"), false);
  assert.equal(isSpecimenDomain(null), false);
});

test("coercePersistedSpecimenDomain maps legacy booking to service-booking", () => {
  assert.equal(coercePersistedSpecimenDomain("booking"), "service-booking");
  assert.equal(coercePersistedSpecimenDomain("commerce"), "commerce");
  assert.equal(coercePersistedSpecimenDomain("newspaper"), undefined);
  assert.equal(coercePersistedSpecimenDomain(null), undefined);
});
