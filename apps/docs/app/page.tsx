import { buildWebPageJsonLd } from "@zedtech/zedkit-seo";

import { JsonLd } from "@/components/json-ld";
import { catalogStats, featuredPackage, gallery } from "@/content/gallery";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { homePage, pageUrl } from "@/lib/site";
import { HomeView } from "@/ui/home/home-view";

export const metadata = docsPageMetadata("/", homePage);

export default function Home() {
  const jsonLd = buildWebPageJsonLd({
    title: homePage.title,
    description: homePage.description,
    url: pageUrl("/"),
  });
  return (
    <>
      <JsonLd data={jsonLd} />
      <HomeView gallery={gallery} stats={catalogStats} featuredPackage={featuredPackage} />
    </>
  );
}
