import { SectionScroll } from "@zedtech/zedkit-ui";
import type { HomeEntryPoint } from "@/content/home-entry-points";
import { HomeBelowHero } from "@/ui/home/home-below-hero";
import { HomeHero } from "@/ui/home/home-hero";

export function HomeView({
  uiGalleryStats,
  entryPoints,
}: {
  uiGalleryStats: { components: number; livePreviews: number };
  entryPoints: HomeEntryPoint[];
}) {
  return (
    <SectionScroll id="home-page" className="content-shrink" data-home-marketing="">
      <HomeHero />
      <HomeBelowHero uiGalleryStats={uiGalleryStats} entryPoints={entryPoints} />
    </SectionScroll>
  );
}
