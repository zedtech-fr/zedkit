import type { ReactNode } from "react";
import { featuredPackageChangelogUrl, featuredPackageVersion } from "@/content/gallery";
import { SiteLayout } from "@/ui/site-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteLayout version={featuredPackageVersion} changelogHref={featuredPackageChangelogUrl}>
      {children}
    </SiteLayout>
  );
}
