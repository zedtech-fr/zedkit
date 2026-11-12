import { SectionScroll } from "@zedtech/zedkit-ui";
import { HomeBelowHero } from "@/ui/home/home-below-hero";
import { HomeHero } from "@/ui/home/home-hero";

export function HomeView() {
  return (
    <SectionScroll id="home-page" className="content-shrink" data-home-marketing="">
      <HomeHero />
      <HomeBelowHero />
    </SectionScroll>
  );
}
