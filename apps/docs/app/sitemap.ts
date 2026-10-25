import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@zedtech/zedkit-seo";

import { docsSite } from "@/lib/site";
import { source } from "#source";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [{ path: "" }, { path: "/docs" }];
  for (const param of source.generateParams()) {
    const slug = param.slug;
    if (slug === undefined || slug.length === 0) continue;
    pages.push({ path: `/docs/${slug.join("/")}` });
  }
  return buildSitemapEntries({
    siteUrl: docsSite.url,
    locales: docsSite.locales,
    localeInPath: false,
    pages,
  });
}
