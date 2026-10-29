import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import type { GalleryCard } from "@/content/gallery";
import type { HomeScenario } from "@/content/home-scenarios";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeBelowHeroDeferred } from "@/ui/home/home-below-hero-deferred";
import { HOME_PAGE_SECTION_GAP, HOME_PAGE_SHELL_CLASS } from "@/ui/home/home-rhythm";

const HomeHero = dynamic(() => import("@/ui/home/home-hero").then((mod) => ({ default: mod.HomeHero })));

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
    <Stack id="home-page" gap={HOME_PAGE_SECTION_GAP} className={HOME_PAGE_SHELL_CLASS}>
      <HomeHero featuredPackage={featuredPackage} version={version} changelogHref={changelogHref} />
      <HomeBelowHeroDeferred
        curatedGallery={curatedGallery}
        galleryCount={galleryCount}
        stats={stats}
        uiGalleryStats={uiGalleryStats}
        scenarios={scenarios}
        entryPoints={entryPoints}
        themeHref={themeHref}
      />
    </Stack>
  );
}
