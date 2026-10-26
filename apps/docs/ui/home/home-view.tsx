import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Reveal, Section, Stack, Stagger, Text } from "@zedtech/zedkit-ui";
import { MaturityBadge } from "@/components/maturity-badge";
import { demoRegistry, type DemoKey } from "@/components/demos/registry";
import type { GalleryCard } from "@/content/gallery";
import type { HomeScenario } from "@/content/home-scenarios";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeEntryPointsSection } from "@/ui/home/home-entry-points-section";
import { HomeHero } from "@/ui/home/home-hero";
import { HomeProofs } from "@/ui/home/home-proofs";
import { HomeScenariosSection } from "@/ui/home/home-scenarios-section";

function isDemoKey(value: string | null): value is DemoKey {
  return value !== null && value in demoRegistry;
}

function GalleryEntry({ card }: { card: GalleryCard }) {
  const entry = isDemoKey(card.demo) ? demoRegistry[card.demo] : null;
  return (
    <Card className="hover-lift">
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
    <Stack gap={8} className="relative isolate mx-auto w-full max-w-5xl min-w-0 overflow-x-hidden px-6 py-12">
      <HomeHero featuredPackage={featuredPackage} version={version} changelogHref={changelogHref} />
      <Reveal>
        <HomeEntryPointsSection entryPoints={entryPoints} />
      </Reveal>
      <Reveal>
        <HomeScenariosSection scenarios={scenarios} />
      </Reveal>
      <HomeProofs
        packages={stats.packages}
        needs={stats.needs}
        uiComponents={uiGalleryStats.components}
        livePreviews={uiGalleryStats.livePreviews}
        themeHref={themeHref}
      />
      <Section title="Components" id="components">
        <Stack gap={4}>
          <Text variant="muted">
            Curated UI previews ({curatedGallery.length} of {galleryCount} components). Open the catalog to filter
            every need across UI, backend, SEO, and agents.
          </Text>
          <Stagger className="grid gap-4 md:grid-cols-3">
            {curatedGallery.map((card) => (
              <GalleryEntry key={card.href} card={card} />
            ))}
          </Stagger>
          <Button asChild variant="outline">
            <Link href="/catalog">Browse full catalog</Link>
          </Button>
        </Stack>
      </Section>
    </Stack>
  );
}
