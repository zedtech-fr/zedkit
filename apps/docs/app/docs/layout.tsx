import type { ReactNode } from "react";
import { IdentitySwitcher } from "@zedtech/zedkit-ui";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "#source";
import { featuredPackageChangelogUrl } from "@/content/gallery";
import { SiteBrand } from "@/ui/site-brand";
import { DocsHeader } from "@/ui/site-headers";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { docsChromeSlots } from "@/ui/site-chrome";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: <SiteBrand />, url: "/" }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks(featuredPackageChangelogUrl)}
      sidebar={{ footer: <IdentitySwitcher /> }}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: true }}
      slots={{ ...docsChromeSlots, header: DocsHeader }}
    >
      {children}
    </DocsLayout>
  );
}
