import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeComponentFamiliesSection } from "@/ui/home/home-component-families-section";
import { HomeIdentitiesSection } from "@/ui/home/home-identities-section";
import { HomePasteSection } from "@/ui/home/home-paste-section";
import { HomeSameIdeaSection } from "@/ui/home/home-same-idea-section";
import { HomeSecondarySection } from "@/ui/home/home-secondary-section";

export type HomeBelowHeroProps = {
  uiGalleryStats: { components: number; livePreviews: number };
  entryPoints: HomeEntryPoint[];
};

/**
 * Marketing sections below the hero, in the order a visitor decides: the joint
 * idea, then one map paste, then the same task in three looks, then where to look next.
 * Kept in the main home payload (not dynamically imported) so section anchors stay in the live layout on first paint.
 *
 * Compose-UI brief:
 * Métier: zedkit publishes npm packages and a docs site, not a hosted app.
 * Client personas: integrating developers who want one paste, then install steps.
 * Customers: the developer's own users — this page does not sell to them.
 * Customer personas: n/a on the docs home; the visitor is the client persona.
 * UI decisions:
 *   same-idea then one combined paste then looks, because the visitor needs
 *   the joint idea before a command, and repeating npm tabs here recreates
 *   the overlap (home-paste-section).
 *   lg three-column same-idea grid, because mobile stacks by priority.
 *   hash aliases stay inside #paste, because README and hero CTAs still
 *   land there until the shortened-hero ticket retargets them.
 */
export function HomeBelowHero({
  uiGalleryStats,
  entryPoints,
}: HomeBelowHeroProps) {
  return (
    <div data-home-below-hero="">
      <HomeSameIdeaSection />
      <HomePasteSection />
      <HomeIdentitiesSection />
      <HomeComponentFamiliesSection componentCount={uiGalleryStats.components} />
      <HomeSecondarySection entryPoints={entryPoints} />
    </div>
  );
}
