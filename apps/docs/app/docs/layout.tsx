import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "#source";
import { featuredPackageChangelogUrl } from "@/content/gallery";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { docsChromeSlots } from "@/ui/site-chrome";
import { DocsHeader } from "@/ui/site-headers";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: "zedkit", url: "/" }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks(featuredPackageChangelogUrl)}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: true }}
      slots={{ ...docsChromeSlots, header: DocsHeader }}
    >
      {children}
    </DocsLayout>
  );
}
