"use client";

import type { ComponentProps, ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { usePathname } from "next/navigation";
import { featuredPackageReleasesUrl, featuredPackageVersion } from "@/content/gallery";
import { isFoundationsPath } from "@/lib/site-nav-data";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { docsChromeSlots } from "@/ui/site-chrome-slots";
import { DocsSiteHeader } from "@/ui/site-headers";
import { SiteBrand } from "@/ui/site-brand";

export function DocsLayoutBranch({
  tree,
  children,
}: {
  tree: ComponentProps<typeof DocsLayout>["tree"];
  children: ReactNode;
}) {
  const foundations = isFoundationsPath(usePathname());
  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: <SiteBrand />,
        url: "/",
        children: foundations ? null : (
          <KitVersionLabel
            version={featuredPackageVersion}
            releasesHref={featuredPackageReleasesUrl}
            tone="shell"
          />
        ),
      }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks()}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: !foundations }}
      sidebar={{ enabled: !foundations }}
      slots={{ ...docsChromeSlots, header: DocsSiteHeader }}
    >
      {children}
    </DocsLayout>
  );
}
