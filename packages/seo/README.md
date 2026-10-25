# @zedkit/seo

Generic SEO bricks: robots, sitemaps, typed JSON-LD, page metadata,
llms.txt, slugs. Pure functions, options-driven, no brand, no CMS.
Original work by the same author.

```sh
pnpm add @zedkit/seo
```

```ts
import { buildRobots, buildSitemapEntries } from "@zedkit/seo";

export async function GET() {
  return Response.json(buildSitemapEntries({ siteUrl, locales, pages }));
}
export function robots() {
  return buildRobots({ siteUrl });
}
```

Return shapes follow the Next.js Metadata API (`MetadataRoute.Robots`,
`MetadataRoute.Sitemap`, `Metadata`) so builders drop straight into
`robots.ts`, `sitemap.ts`, and `generateMetadata`. JSON-LD builders
return `schema-dts` types. Map CMS docs to the plain `pages`/`videos`
inputs first — the package never talks to a CMS.

## API

- `buildRobots({ siteUrl, extraSitemaps?, disallow?, allow? })`
- `buildSitemapEntries({ siteUrl, locales, pages })`
- `buildVideoSitemap({ videos })`, `escapeXml(value)`
- `buildOrganizationJsonLd`, `buildWebPageJsonLd`,
  `buildBreadcrumbJsonLd`, `buildArticleJsonLd`
- `buildPageMetadata({ site, page, locale, pathname, ogImage?, robots? })`
- `llmsTextResponse({ body })`, `normalizeLlmsBody`, `buildLlmsFull`
- `truncateDescription`, `resolveDescription`, `resolveLocalizedField`
- `normalizeSlug`, `isDraftSlug`

See CATALOG.md for needs-first examples.
