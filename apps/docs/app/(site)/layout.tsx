import type { ReactNode } from "react";
import { featuredPackageChangelogUrl } from "@/content/gallery";
import { SiteLayout } from "@/ui/site-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteLayout changelogHref={featuredPackageChangelogUrl}>
      {children}
    </SiteLayout>
  );
}
