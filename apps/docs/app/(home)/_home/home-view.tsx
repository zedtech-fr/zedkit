import { HomeHero } from "./home-hero";
import { HOME_MARKETING_ROOT_PROPS } from "./home-rhythm";
import { HomeBelowHero } from "./home-below-hero";

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
