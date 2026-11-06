/** robots.txt content, shaped for Next.js `MetadataRoute.Robots` routes. */
export interface RobotsConfig {
  rules: {
    userAgent: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
  } | Array<{
    userAgent: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
  }>;
  sitemap?: string | string[];
}

export interface BuildRobotsOptions {
  /** Absolute site URL, e.g. `https://example.com` (trailing slash trimmed). */
  siteUrl: string;
  /** Extra sitemap URLs besides the default `/sitemap.xml` (e.g. a video sitemap). */
  extraSitemaps?: string[];
  /** Paths crawlers may not visit. Defaults to the admin area. */
  disallow?: string[];
  /** Paths crawlers may visit. Defaults to `/`. */
  allow?: string[];
}

export function buildRobots(options: BuildRobotsOptions): RobotsConfig {
  const base = options.siteUrl.replace(/\/$/, "");
  const extra = options.extraSitemaps ?? [];
  const sitemap = extra.length === 0 ? `${base}/sitemap.xml` : [`${base}/sitemap.xml`, ...extra];
  return {
    rules: {
      userAgent: "*",
      allow: options.allow ?? "/",
      disallow: options.disallow ?? "/admin/",
    },
    sitemap,
  };
}
