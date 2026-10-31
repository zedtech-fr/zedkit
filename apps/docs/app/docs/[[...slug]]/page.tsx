import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@zedtech/zedkit-seo";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";

import { Stack } from "@zedtech/zedkit-ui";

import { JsonLd } from "@/components/json-ld";
import { featuredPackageChangelogUrl } from "@/content/gallery";
import { mergeComponentPageToc } from "@/lib/component-page-toc";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { pageUrl } from "@/lib/site";
import { getMDXComponents } from "@/mdx-components";
import { SiteMaintainerFooter } from "@/ui/site-footer";
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

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const pathname = docsPath(slug);
  const url = pageUrl(pathname);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", url: pageUrl("/") },
    { name: "Documentation", url: pageUrl("/docs") },
    { name: page.data.title, url },
  ]);
  const description = page.data.description ?? page.data.title;
  const jsonLd = buildWebPageJsonLd({
    title: page.data.title,
    description,
    url,
    breadcrumb,
  });
  const MDX = page.data.body;
  return (
    <>
      <JsonLd data={jsonLd} />
      <DocsPage
        toc={page.data.componentPage ? mergeComponentPageToc(page.data.toc) : page.data.toc}
        tableOfContentPopover={{
          trigger: {
            "aria-label": "Table of contents",
            title: "Table of contents",
          },
        }}
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <MDX components={getMDXComponents()} />
        </DocsBody>
        <Stack className="mt-section-md">
          <SiteMaintainerFooter changelogHref={featuredPackageChangelogUrl} embeddedInMain />
        </Stack>
      </DocsPage>
    </>
  );
}
