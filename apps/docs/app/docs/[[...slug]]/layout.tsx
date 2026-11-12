import type { ReactNode } from "react";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "#source";
import { SiteBrand } from "@/ui/site-brand";
import { docsLayoutTree } from "@/features/docs/docs-layout-tree.mjs";
import { isFoundationsPath } from "@/lib/site-nav-data";
import { docsChromeSlots } from "@/ui/site-chrome-slots";
import { DocsDesktopHeader, DocsSiteHeader } from "@/ui/site-headers";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const pathname = slug === undefined || slug.length === 0 ? "/docs" : `/docs/${slug.join("/")}`;
  // Theme switch stays off on every docs route, including foundations: appearance follows the visitor (no light pin).
  return (
    <>
      {isFoundationsPath(pathname) ? null : <DocsDesktopHeader />}
      <DocsLayout
        tree={docsLayoutTree(source.pageTree, slug) as Root}
        nav={{
          title: <SiteBrand />,
          url: "/",
        }}
        searchToggle={{ enabled: true }}
        themeSwitch={{ enabled: false }}
        sidebar={{ enabled: !isFoundationsPath(pathname), collapsible: false }}
        slots={{ ...docsChromeSlots, header: DocsSiteHeader }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
