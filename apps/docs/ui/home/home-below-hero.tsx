import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeClosingSection } from "@/ui/home/home-closing-section";
import { HomeComponentFamiliesSection } from "@/ui/home/home-component-families-section";
import { HomeIdentitiesSection } from "@/ui/home/home-identities-section";
import { HomeLimitsSection } from "@/ui/home/home-limits-section";
import { HomeManifestoSection } from "@/ui/home/home-manifesto-section";
import { HomePasteSection } from "@/ui/home/home-paste-section";
import { HomeSameIdeaSection } from "@/ui/home/home-same-idea-section";
import { HomeSecondarySection } from "@/ui/home/home-secondary-section";
import { HomeSixSentencesSection } from "@/ui/home/home-six-sentences-section";

export type HomeBelowHeroProps = {
  uiGalleryStats: { components: number; livePreviews: number };
  entryPoints: HomeEntryPoint[];
};

/**
 * Marketing sections below the hero, in the order a visitor decides: two
 * places, six facts, hash landing plus Getting started, then the same task
 * in four looks, then limits, manifesto, closing ask, then where to look next.
 * Kept in the main home payload (not dynamically imported) so section anchors stay in the live layout on first paint.
 *
 * Compose-UI brief:
 * Métier: zedkit publishes npm packages and a docs site, not a hosted app.
 * Client personas: integrating developers who want one paste, then honest limits, on a laptop or a phone.
 * Customers: the developer's own users — this page does not sell to them.
 * Customer personas: n/a on the docs home.
 * UI decisions:
 *   two-place same-idea then six facts then one paste, because: client =
 *   integrating developer who just saw a hero paste and needs the joint idea
 *   before another command.
 *   lg two-column same-idea grid, because: mobile stacks by priority.
 *   hash aliases stay inside #paste, because: README and hero CTAs still
 *   land there.
 *   paste is a dark zinc band with a file listing, because: neighbours must
 *   differ in shape and the mockup's paste surface was not a #73 drop.
 *   limits then manifesto then closing before families, because: the visitor
 *   should read what it does not do and the lock-in quote before the rest of
 *   the kit.
 */
export function HomeBelowHero({
  uiGalleryStats,
  entryPoints,
}: HomeBelowHeroProps) {
  return (
    <div data-home-below-hero="">
      <HomeSameIdeaSection />
      <HomeSixSentencesSection />
      <HomePasteSection />
      <HomeIdentitiesSection />
      <HomeLimitsSection />
      <HomeManifestoSection />
      <HomeClosingSection />
      <HomeComponentFamiliesSection componentCount={uiGalleryStats.components} />
      <HomeSecondarySection entryPoints={entryPoints} />
    </div>
  );
}
