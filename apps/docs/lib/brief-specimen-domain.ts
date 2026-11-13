import { DOMAIN_KEYWORDS, selectSpecimenDomain, type SpecimenDomain } from "@zedtech/zedkit-ui/marketing";

export type { SpecimenDomain };

const LEGACY_BOOKING_ID = "booking";

/** Keeps the first user brief when follow-ups are short refinements. */
export function specimenBriefFromThread(thread: readonly { role: string; text: string }[], fallback: string): string {
  const first = thread.find((turn) => turn.role === "user")?.text.trim();
  return first || fallback;
}

/** Picks the closest domain from plain text via the kit scorer (empty → saas-dashboard). */
export function specimenDomainFromBrief(text: string): SpecimenDomain {
  return selectSpecimenDomain(text);
}

/** True when a persisted or incoming value is one of the four kit specimen domains. */
export function isSpecimenDomain(value: unknown): value is SpecimenDomain {
  return typeof value === "string" && Object.hasOwn(DOMAIN_KEYWORDS, value);
}

/** Maps a persisted domain id onto the live kit union (`booking` → `service-booking`). */
export function coercePersistedSpecimenDomain(value: unknown): SpecimenDomain | undefined {
  const mapped = value === LEGACY_BOOKING_ID ? "service-booking" : value;
  return isSpecimenDomain(mapped) ? mapped : undefined;
}
