import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@zedtech/zedkit-seo";

import { docsSite } from "@/lib/site";
import { source } from "#source";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // shortcut: one build-date lastmod for every URL; per-page git dates when the export needs them.
  const lastModified = new Date();
  const pages = [{ path: "", lastModified }, { path: "/catalog", lastModified }, { path: "/docs", lastModified }, { path: "/examples/note-list", lastModified }];
  for (const param of source.generateParams()) {
    const slug = param.slug;
    if (slug === undefined || slug.length === 0) continue;
    pages.push({ path: `/docs/${slug.join("/")}`, lastModified });
  }
  return buildSitemapEntries({
    siteUrl: docsSite.url,
    locales: docsSite.locales,
    localeInPath: false,
    pages,
  });
}
