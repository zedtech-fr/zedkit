import type { ReactNode } from "react";
import { featuredPackageChangelogUrl, featuredPackageReleasesUrl, featuredPackageVersion } from "@/content/gallery";
import { SiteLayout } from "@/ui/site-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteLayout
      version={featuredPackageVersion}
      changelogHref={featuredPackageChangelogUrl}
      releasesHref={featuredPackageReleasesUrl}
    >
      {children}
    </SiteLayout>
  );
}
