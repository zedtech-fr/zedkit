import type { ReactNode } from "react";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "#source";
import { SiteBrand } from "@/ui/site-brand";
import { siteHeaderLinks } from "@/lib/site-header-links";
import { docsLayoutTree } from "@/lib/docs-layout-tree.mjs";
import { isFoundationsPath } from "@/lib/site-nav-data";
import { docsChromeSlots } from "@/ui/site-chrome-slots";
import { DocsSiteHeader } from "@/ui/site-headers";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const pathname = slug === undefined || slug.length === 0 ? "/docs" : `/docs/${slug.join("/")}`;
  return (
    <DocsLayout
      tree={docsLayoutTree(source.pageTree, slug) as Root}
      nav={{
        title: <SiteBrand />,
        url: "/",
      }}
      githubUrl="https://github.com/zedtech-fr/zedkit"
      links={siteHeaderLinks()}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: false }}
      sidebar={{ enabled: !isFoundationsPath(pathname) }}
      slots={{ ...docsChromeSlots, header: DocsSiteHeader }}
    >
      {children}
    </DocsLayout>
  );
}
