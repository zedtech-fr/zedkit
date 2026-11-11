import type { ReactNode } from "react";
import { featuredPackageReleasesUrl, featuredPackageVersion } from "@/content/gallery";
import { SiteLayout } from "@/ui/site-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteLayout
      version={featuredPackageVersion}
      releasesHref={featuredPackageReleasesUrl}
    >
      {children}
    </SiteLayout>
  );
}
