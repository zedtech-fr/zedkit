import { HomeClosingSection } from "./sections/home-closing-section";
import { HomeIdentitiesSection } from "./sections/home-identities-section";
import { HomeLimitsSection } from "./sections/home-limits-section";
import { HomeManifestoSection } from "./sections/home-manifesto-section";
import { HomePasteSection } from "./sections/home-paste-section";
import { HomeSameIdeaSection } from "./sections/home-same-idea-section";
import { HomeSixSentencesSection } from "./sections/home-six-sentences-section";

/**
 * Marketing sections below the hero, in the order a visitor decides: the
 * three-card same-idea band, six quote/reply cards, hash landing, then the same task
 * in four looks, then limits, manifesto, closing ask.
 * Kept in the main home payload (not dynamically imported) so section anchors stay in the live layout on first paint.
 *
 * Compose-UI brief:
 * Métier: zedkit publishes npm packages and a docs site, not a hosted app.
 * Client personas: integrating developers who want one paste, then honest limits, on a laptop or a phone.
 * Customers: the developer's own users — this page does not sell to them.
 * Customer personas: n/a on the docs home.
 * UI decisions:
 *   three-card same-idea then six quote/reply cards then one paste, because:
 *   client = integrating developer who just saw a hero paste and needs the
 *   joint idea before another command, and still hears agent excuses.
 *   lg three-card same-idea grid plus a lands bar, because: mobile stacks
 *   by priority and the mockup is AI, UI and Together as one band.
 *   hash aliases stay inside #paste, because: README and hero CTAs still
 *   land there.
 *   paste is a dark zinc band with a file listing, because: neighbours must
 *   differ in shape and the mockup's paste surface was not a #73 drop.
 *   looks then limits then manifesto then closing, because: the visitor
 *   should read what it does not do and the lock-in quote (readLink "Read
 *   the manifesto") before the closing copyable prompt. Catalog and nav
 *   already list components and package areas.
 */
export function HomeBelowHero({
  uiGalleryStats,
}: {
  uiGalleryStats: { components: number; livePreviews: number };
}) {
  return (
    <div data-home-below-hero="">
      <HomeSameIdeaSection componentCount={uiGalleryStats.components} />
      <HomeSixSentencesSection componentCount={uiGalleryStats.components} />
      <HomePasteSection />
      <HomeIdentitiesSection />
      <HomeLimitsSection />
      <HomeManifestoSection />
      <HomeClosingSection />
    </div>
  );
}
