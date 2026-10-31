import { Suspense } from "react";
import { buildWebPageJsonLd } from "@zedtech/zedkit-seo";

import { JsonLd } from "@/components/json-ld";
import { catalogIndex } from "@/content/catalog-index";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { homePage, pageUrl } from "@/lib/site";
import { CatalogViewFromUrl } from "@/ui/catalog/catalog-view";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/catalog", {
  title: `Catalog · ${homePage.title}`,
  description: "Browse and filter every zedkit catalog need by area, maturity, and search text.",
});

export default function CatalogPage() {
  const jsonLd = buildWebPageJsonLd({
    title: "Catalog",
    description: "Filterable index of zedkit catalog needs.",
    url: pageUrl("/catalog"),
  });
  return (
    <div data-catalog-shell>
      <JsonLd data={jsonLd} />
      <Suspense
        fallback={
          <div data-catalog-shell className="py-section-lg">
            Loading catalog…
          </div>
        }
      >
        <CatalogViewFromUrl entries={catalogIndex} />
      </Suspense>
    </div>
  );
}
