import Link from "next/link";
import { Button, Section, Stack } from "@zedtech/zedkit-ui";
import { CatalogActionLabel } from "@/components/docs-action-label";
import type { GalleryCard } from "@/content/gallery";
import type { HomeScenario } from "@/content/home-scenarios";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeEntryPointsSection } from "@/ui/home/home-entry-points-section";
import { HomeGalleryCard } from "@/ui/home/home-gallery-card";
import { HomeProofs } from "@/ui/home/home-proofs";
import { HomeScenariosSection } from "@/ui/home/home-scenarios-section";
import {
  HOME_CARD_GRID_THREE_COL,
  HOME_MARKETING_ROOT_PROPS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

export type HomeBelowHeroProps = {
  curatedGallery: GalleryCard[];
  galleryCount: number;
  stats: { packages: number; needs: number };
  uiGalleryStats: { components: number; livePreviews: number };
  scenarios: HomeScenario[];
  entryPoints: HomeEntryPoint[];
  themeHref: string;
  version: string;
  releasesHref: string;
};

/** Marketing sections below the hero — code-split from the first home payload (#618). */
export function HomeBelowHero({
  curatedGallery,
  galleryCount,
  stats,
  uiGalleryStats,
  scenarios,
  entryPoints,
  themeHref,
  version,
  releasesHref,
}: HomeBelowHeroProps) {
  return (
    <div {...HOME_MARKETING_ROOT_PROPS} data-home-below-hero="">
      <HomeEntryPointsSection entryPoints={entryPoints} />
      <HomeScenariosSection scenarios={scenarios} />
      <HomeProofs
        packages={stats.packages}
        needs={stats.needs}
        uiComponents={uiGalleryStats.components}
        livePreviews={uiGalleryStats.livePreviews}
        themeHref={themeHref}
        version={version}
        releasesHref={releasesHref}
      />
      <Section
        bleed
        tone="muted"
        spacing="lg"
        containerWidth="wide"
        title="Components"
        id="components"
        description={`Curated UI previews (${curatedGallery.length} of ${galleryCount} components). Open the catalog to filter every need across UI, core & server, SEO, and agents.`}
      >
        <Stack gap={HOME_SECTION_CONTENT_GAP}>
          <Stack className={HOME_CARD_GRID_THREE_COL}>
            {curatedGallery.map((card, index) => (
              <HomeGalleryCard
                key={card.href}
                card={card}
                className={index >= 2 ? "hidden min-w-0 md:flex md:flex-col" : "min-w-0"}
              />
            ))}
          </Stack>
          <Button asChild variant="outline">
            <Link href="/catalog">
              <CatalogActionLabel>Browse full catalog</CatalogActionLabel>
            </Link>
          </Button>
        </Stack>
      </Section>
    </div>
  );
}
