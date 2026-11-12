import { HomeBelowHero } from "@/ui/home/home-below-hero";
import { HomeHero } from "@/ui/home/home-hero";
import { HOME_MARKETING_ROOT_PROPS } from "@/ui/home/home-rhythm";

export function HomeView({
  uiGalleryStats,
}: {
  uiGalleryStats: { components: number; livePreviews: number };
}) {
  return (
    <div {...HOME_MARKETING_ROOT_PROPS} id="home-page" className="content-shrink">
      <HomeHero />
      <HomeBelowHero uiGalleryStats={uiGalleryStats} />
    </div>
  );
}
