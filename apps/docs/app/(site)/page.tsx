import { buildWebPageJsonLd } from "@zedtech/zedkit-seo";

import { JsonLd } from "@/components/json-ld";
import {
  catalogStats,
  featuredPackage,
  featuredPackageLatestChange,
  featuredPackageReleasesUrl,
  featuredPackageVersion,
  gallery,
  homeCuratedGallery,
  uiGalleryStats,
} from "@/content/gallery";
import { homeEntryPoints } from "@/content/home-entry-points";
import { homeScenarios } from "@/content/home-scenarios";
import { homePage, pageUrl } from "@/lib/site";
import { HomeView } from "@/ui/home/home-view";

const themeHref =
  homeScenarios.find((scenario) => scenario.href.includes("theme-an-admin"))?.href ??
  "/docs/ui/theme-an-admin-app-dark-light-included";

export default function Home() {
  const jsonLd = buildWebPageJsonLd({
    title: homePage.title,
    description: homePage.description,
    url: pageUrl("/"),
  });
  return (
    <>
      <JsonLd data={jsonLd} />
      <HomeView
      curatedGallery={homeCuratedGallery}
      galleryCount={gallery.length}
      stats={catalogStats}
      featuredPackage={featuredPackage}
      version={featuredPackageVersion}
      releasesHref={featuredPackageReleasesUrl}
      latestChange={featuredPackageLatestChange}
      uiGalleryStats={uiGalleryStats}
      scenarios={homeScenarios}
      entryPoints={homeEntryPoints}
      themeHref={themeHref}
    />
    </>
  );
}
