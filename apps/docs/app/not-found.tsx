import type { Metadata } from "next";

import { featuredPackageChangelogUrl, featuredPackageVersion } from "@/content/gallery";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { NotFoundView } from "@/ui/not-found/not-found-view";
import { SiteLayout } from "@/ui/site-layout";

export const metadata: Metadata = docsPageMetadata(
  "/404",
  {
    title: "Page not found",
    description: "This URL is not part of the zedkit docs site.",
  },
  { index: false },
);

export default function NotFound() {
  return (
    <SiteLayout version={featuredPackageVersion} changelogHref={featuredPackageChangelogUrl}>
      <NotFoundView />
    </SiteLayout>
  );
}
