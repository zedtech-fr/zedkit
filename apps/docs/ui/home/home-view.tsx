import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IdentityTour,
  Section,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { MaturityBadge } from "@/components/maturity-badge";
import { demoRegistry, type DemoKey } from "@/components/demos/registry";
import type { GalleryCard } from "@/content/gallery";
import type { HomeScenario } from "@/content/home-scenarios";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeEntryPointsSection } from "@/ui/home/home-entry-points-section";
import { HomeHero } from "@/ui/home/home-hero";
import { HomeProofs } from "@/ui/home/home-proofs";
import { HomeScenariosSection } from "@/ui/home/home-scenarios-section";
import {
  HOME_CARD_GRID_THREE_COL,
  HOME_PAGE_SECTION_GAP,
  HOME_PAGE_SHELL_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

function isDemoKey(value: string | null): value is DemoKey {
  return value !== null && value in demoRegistry;
}

function GalleryEntry({ card }: { card: GalleryCard }) {
  const entry = isDemoKey(card.demo) ? demoRegistry[card.demo] : null;
  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>
          <Link href={card.href}>{card.title}</Link>
        </CardTitle>
        <MaturityBadge status={card.status} />
      </CardHeader>
      <CardContent>
        {entry ? <entry.Demo /> : <Text variant="muted">{card.detail}</Text>}
      </CardContent>
    </Card>
  );
}

export function HomeView({
  curatedGallery,
  galleryCount,
  stats,
  featuredPackage,
  version,
  changelogHref,
  uiGalleryStats,
  scenarios,
  entryPoints,
  themeHref,
}: {
  curatedGallery: GalleryCard[];
  galleryCount: number;
  stats: { packages: number; needs: number };
  featuredPackage: string;
  version: string;
  changelogHref: string;
  uiGalleryStats: { components: number; livePreviews: number };
  scenarios: HomeScenario[];
  entryPoints: HomeEntryPoint[];
  themeHref: string;
}) {
  return (
    <>
      <Stack
        id="home-page"
        gap={HOME_PAGE_SECTION_GAP}
        className={HOME_PAGE_SHELL_CLASS}
      >
        <HomeHero
          featuredPackage={featuredPackage}
          version={version}
          changelogHref={changelogHref}
        />
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
          title="Components"
          id="components"
          description={`Curated UI previews (${curatedGallery.length} of ${galleryCount} components). Open the catalog to filter every need across UI, backend, SEO, and agents.`}
        >
          <Stack gap={HOME_SECTION_CONTENT_GAP}>
            <Stack className={HOME_CARD_GRID_THREE_COL}>
              {curatedGallery.map((card) => (
                <GalleryEntry key={card.href} card={card} />
              ))}
            </Stack>
            <Button asChild variant="outline">
              <Link href="/catalog">Browse full catalog</Link>
            </Button>
          </Stack>
        </Section>
      </Stack>
      <IdentityTour />
    </>
  );
}
