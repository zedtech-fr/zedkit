import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { demoRegistry, type DemoKey } from "@/components/demos/registry";
import type { GalleryCard } from "@/content/gallery";
import type { HomeScenario } from "@/content/home-scenarios";
import { HomeHero } from "@/ui/home/home-hero";
import { HomeProofs } from "@/ui/home/home-proofs";
import { HomeScenariosSection } from "@/ui/home/home-scenarios-section";

function isDemoKey(value: string | null): value is DemoKey {
  return value !== null && value in demoRegistry;
}

function GalleryEntry({ card }: { card: GalleryCard }) {
  const entry = isDemoKey(card.demo) ? demoRegistry[card.demo] : null;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>
          <Link href={card.href}>{card.title}</Link>
        </CardTitle>
        <Badge>{card.status}</Badge>
      </CardHeader>
      <CardContent>
        {entry ? <entry.Demo /> : <Text variant="muted">{card.detail}</Text>}
      </CardContent>
    </Card>
  );
}

export function HomeView({
  gallery,
  stats,
  featuredPackage,
  uiGalleryStats,
  scenarios,
  themeHref,
}: {
  gallery: GalleryCard[];
  stats: { packages: number; needs: number };
  featuredPackage: string;
  uiGalleryStats: { components: number; livePreviews: number };
  scenarios: HomeScenario[];
  themeHref: string;
}) {
  return (
    <Stack gap={8} className="mx-auto w-full max-w-5xl px-6 py-12">
      <HomeHero featuredPackage={featuredPackage} />
      <HomeScenariosSection scenarios={scenarios} />
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
            Full UI catalog — same cards as the generator; maturity badge on every entry.
          </Text>
          <Stack className="grid gap-4 md:grid-cols-3">
            {gallery.map((card) => (
              <GalleryEntry key={card.href} card={card} />
            ))}
          </Stack>
        </Stack>
      </Section>
    </Stack>
  );
}
