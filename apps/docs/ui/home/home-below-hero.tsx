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
