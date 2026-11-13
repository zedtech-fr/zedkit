import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@zedtech/zedkit-seo";
import { JsonLd } from "@zedtech/zedkit-seo/react";
import type { TOCItemType } from "fumadocs-core/toc";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";

import { Stack } from "@zedtech/zedkit-ui";

import { docsPageCopy } from "@/app/i18n/docs-page-copy";
import { mergeComponentPageToc } from "@/features/docs/component-page-toc";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { pageUrl } from "@/lib/site";
import { isFoundationsPath } from "@/lib/site-nav-data";
import { getMDXComponents } from "@/mdx-components";
import { DocsMainContent } from "./_docs/docs-main-content";
import { SiteMaintainerFooter } from "@/components/site-chrome/site-footer";
import { source } from "#source";

export async function generateStaticParams() {
  return source.generateParams();
}

function docsPath(slug?: string[]): string {
  if (slug === undefined || slug.length === 0) return "/docs";
  return `/docs/${slug.join("/")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) return {};
  const description = page.data.description ?? page.data.title;
  return docsPageMetadata(docsPath(slug), {
    title: page.data.title,
    description,
  });
}

function docsPageChrome(opts: {
  foundations: boolean;
  componentPage: boolean;
  toc: TOCItemType[];
  sections: readonly string[];
}) {
  if (opts.foundations) {
    return {
      full: true as const,
      toc: [] as TOCItemType[],
      tableOfContent: { enabled: false as const },
      tableOfContentPopover: { enabled: false as const },
      "data-foundations-page": "",
    };
  }
  if (opts.componentPage) {
    return {
      toc: mergeComponentPageToc(opts.toc, opts.sections),
      tableOfContent: { enabled: false },
      tableOfContentPopover: { enabled: false },
    };
  }
  return {
    toc: opts.toc,
    tableOfContentPopover: {
      trigger: {
        "aria-label": docsPageCopy.tableOfContents,
        title: docsPageCopy.tableOfContents,
      },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const pathname = docsPath(slug);
  const url = pageUrl(pathname);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: docsPageCopy.breadcrumbHome, url: pageUrl("/") },
    { name: docsPageCopy.breadcrumbDocs, url: pageUrl("/docs") },
    { name: page.data.title, url },
  ]);
  const description = page.data.description ?? page.data.title;
  const jsonLd = buildWebPageJsonLd({ title: page.data.title, description, url, breadcrumb });
  const MDX = page.data.body;
  const hidePageTitle = page.data.hidePageTitle === true;
  const foundations = isFoundationsPath(pathname);
  const skipDocsBody = page.data.componentPage === true || foundations;
  const chrome = docsPageChrome({
    foundations,
    componentPage: page.data.componentPage === true,
    toc: page.data.toc,
    sections: page.data.componentSections ?? [],
  });
  return (
    <>
      <JsonLd data={jsonLd} />
      <DocsPage slots={{ container: DocsMainContent }} {...chrome}>
        {hidePageTitle ? null : <DocsTitle>{page.data.title}</DocsTitle>}
        {page.data.componentPage || hidePageTitle ? null : <DocsDescription>{page.data.description}</DocsDescription>}
        {skipDocsBody ? (
          // Component pages and foundations are composed from kit components; the `prose` reset DocsBody adds would restyle them.
          <Stack className="flex-1">
            <MDX components={getMDXComponents()} />
          </Stack>
        ) : (
          <DocsBody>
            <MDX components={getMDXComponents()} />
          </DocsBody>
        )}
        <SiteMaintainerFooter embeddedInMain />
      </DocsPage>
    </>
  );
}
