import {
  buildOrganizationJsonLd,
  buildSoftwareSourceCodeJsonLd,
  buildWebPageJsonLd,
} from "@zedtech/zedkit-seo";

import { JsonLd } from "@/components/json-ld";
import { uiGalleryStats } from "@/content/gallery";
import { PUBLIC_SITE_URL, homePage, pageUrl } from "@/lib/site";
import { HomeView } from "@/ui/home/home-view";

const siteUrl = PUBLIC_SITE_URL.replace(/\/$/, "");

export default function Home() {
  const jsonLd = buildWebPageJsonLd({
    title: homePage.title,
    description: homePage.description,
    url: pageUrl("/"),
  });
  const organizationJsonLd = buildOrganizationJsonLd({
    name: "ZED TECH",
    url: siteUrl,
    logoUrl: pageUrl("/opengraph-image"),
    sameAs: ["https://github.com/zedtech-fr/zedkit"],
  });
  const softwareJsonLd = buildSoftwareSourceCodeJsonLd({
    name: "zedkit",
    url: siteUrl,
    codeRepository: "https://github.com/zedtech-fr/zedkit",
    programmingLanguage: "TypeScript",
    license: "https://github.com/zedtech-fr/zedkit/blob/main/LICENSE",
  });
  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={softwareJsonLd} />
      <HomeView uiGalleryStats={uiGalleryStats} />
    </>
  );
}
