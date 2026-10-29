import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import type { GalleryCard } from "@/content/gallery";
import type { HomeScenario } from "@/content/home-scenarios";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeHero } from "@/ui/home/home-hero";
import { HOME_PAGE_SECTION_GAP, HOME_PAGE_SHELL_CLASS } from "@/ui/home/home-rhythm";

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
      <HomeBelowHero
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
