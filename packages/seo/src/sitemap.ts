/** Sitemap entry, shaped for Next.js `MetadataRoute.Sitemap` routes. */
export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export interface SitemapPage {
  /** Locale-less path: `""` for the home page, else `/path` or `/section/slug`. */
  path: string;
  lastModified?: string | Date;
  changeFrequency?: SitemapEntry["changeFrequency"];
  priority?: number;
}

export interface BuildSitemapOptions {
  /** Absolute site URL, e.g. `https://example.com` (trailing slash trimmed). */
  siteUrl: string;
  /** Locales to prefix every page with, e.g. `["en", "fr"]`. */
  locales: string[];
  /** Pages to list under each locale. Map CMS docs to this shape first. */
  pages: SitemapPage[];
  /** When false, URLs omit locale segments and each page is listed once. Default true. */
  localeInPath?: boolean;
}

export function buildSitemapEntries(options: BuildSitemapOptions): SitemapEntry[] {
  const base = options.siteUrl.replace(/\/$/, "");
  const entries: SitemapEntry[] = [];
  const localeInPath = options.localeInPath ?? true;
  const push = (page: SitemapPage, url: string) => {
    entries.push({
      url,
      ...(page.lastModified === undefined ? {} : { lastModified: page.lastModified }),
      ...(page.changeFrequency === undefined ? {} : { changeFrequency: page.changeFrequency }),
      ...(page.priority === undefined ? {} : { priority: page.priority }),
    });
  };
  if (!localeInPath) {
    for (const page of options.pages) {
      push(page, page.path === "" ? `${base}/` : `${base}${page.path}`);
    }
    return entries;
  }
  for (const locale of options.locales) {
    for (const page of options.pages) {
      push(page, `${base}/${locale}${page.path}`);
    }
  }
  return entries;
}
