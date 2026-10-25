import {
  catalogStats,
  featuredPackage,
  featuredPackageChangelogUrl,
  featuredPackageVersion,
  gallery,
  uiGalleryStats,
} from "@/content/gallery";
import { homeScenarios } from "@/content/home-scenarios";
import { HomeView } from "@/ui/home/home-view";

const themeHref =
  homeScenarios.find((scenario) => scenario.href.includes("theme-an-admin"))?.href ??
  "/docs/ui/theme-an-admin-app-dark-light-included";

export default function Home() {
  return (
    <HomeView
      gallery={gallery}
      stats={catalogStats}
      featuredPackage={featuredPackage}
      version={featuredPackageVersion}
      changelogHref={featuredPackageChangelogUrl}
      uiGalleryStats={uiGalleryStats}
      scenarios={homeScenarios}
      themeHref={themeHref}
    />
  );
}
