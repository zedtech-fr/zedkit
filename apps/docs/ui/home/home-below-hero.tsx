import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { CatalogActionLabel } from "@/components/docs-action-label";
import { MaturityBadge } from "@/components/maturity-badge";
import type { GalleryCard } from "@/content/gallery";
import { homeGalleryDemos } from "@/components/home-gallery-demos";
import type { HomeScenario } from "@/content/home-scenarios";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeEntryPointsSection } from "@/ui/home/home-entry-points-section";
import { HomeProofs } from "@/ui/home/home-proofs";
import { HomeScenariosSection } from "@/ui/home/home-scenarios-section";
import {
  HOME_CARD_GRID_THREE_COL,
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

function GalleryEntry({ card }: { card: GalleryCard }) {
  const Demo = card.demo ? homeGalleryDemos[card.demo] : undefined;
  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">
          <Link href={card.href}>{card.title}</Link>
        </CardTitle>
        <MaturityBadge status={card.status} />
      </CardHeader>
      <CardContent>
        {Demo ? <Demo /> : <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>{card.detail}</Text>}
      </CardContent>
    </Card>
  );
}

export type HomeBelowHeroProps = {
  curatedGallery: GalleryCard[];
  galleryCount: number;
  stats: { packages: number; needs: number };
  uiGalleryStats: { components: number; livePreviews: number };
  scenarios: HomeScenario[];
  entryPoints: HomeEntryPoint[];
  themeHref: string;
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
            {curatedGallery.map((card) => (
              <GalleryEntry key={card.href} card={card} />
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
