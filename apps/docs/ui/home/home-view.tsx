import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import type { GalleryCard } from "@/content/gallery";
import type { HomeScenario } from "@/content/home-scenarios";
import type { HomeEntryPoint } from "@/content/home-entry-points";

const HomeHero = dynamic(() => import("@/ui/home/home-hero").then((mod) => ({ default: mod.HomeHero })));

const HomeBelowHero = dynamic(
  () => import("@/ui/home/home-below-hero").then((mod) => ({ default: mod.HomeBelowHero })),
  {
    loading: () => (
      <Stack aria-busy="true" className="min-h-screen w-full">
        <section id="entry-points" className="sr-only" />
        <section id="scenarios" className="sr-only" />
        <section id="proofs" className="sr-only" />
        <section id="components" className="sr-only" />
      </Stack>
    ),
  },
);

export function HomeView({
  curatedGallery,
  galleryCount,
  stats,
  featuredPackage,
  version,
  releasesHref,
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
  releasesHref: string;
  uiGalleryStats: { components: number; livePreviews: number };
  scenarios: HomeScenario[];
  entryPoints: HomeEntryPoint[];
  themeHref: string;
}) {
  return (
    <div id="home-page" className="min-w-0">
      <HomeHero
        featuredPackage={featuredPackage}
        version={version}
        releasesHref={releasesHref}
        stats={stats}
        uiStats={uiGalleryStats}
      />
      <HomeBelowHero
        curatedGallery={curatedGallery}
        galleryCount={galleryCount}
        stats={stats}
        uiGalleryStats={uiGalleryStats}
        scenarios={scenarios}
        entryPoints={entryPoints}
        themeHref={themeHref}
        version={version}
        releasesHref={releasesHref}
        latestChange={latestChange}
      />
    </div>
  );
}
