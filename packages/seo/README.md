# @zedtech/zedkit-seo

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-seo.svg)](https://www.npmjs.com/package/@zedtech/zedkit-seo)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

Ship sitemaps, robots, typed JSON-LD, metadata, hreflang, slugs and
llms.txt without thinking about the specs. Pure functions,
options-driven, no brand, no CMS. Original work by the same author.

## Install

```sh
pnpm add @zedtech/zedkit-seo
```

## Usage

```ts
import { buildRobots, buildSitemapEntries } from "@zedtech/zedkit-seo";

export async function GET() {
  return Response.json(buildSitemapEntries({ siteUrl, locales, pages }));
}
export function robots() {
  return buildRobots({ siteUrl });
}
```

## When to use

Reach for this package when you render SEO outputs (robots, sitemaps,
metadata, JSON-LD) from plain data. It never talks to a CMS: pair it
with `@zedtech/zedkit-payload-seo` when your content lives in Payload.

Return shapes follow the Next.js Metadata API (`MetadataRoute.Robots`,
`MetadataRoute.Sitemap`, `Metadata`) so builders drop straight into
`robots.ts`, `sitemap.ts`, and `generateMetadata`. JSON-LD builders
return `schema-dts` types. Map CMS docs to the plain `pages`/`videos`
inputs first — the package never talks to a CMS.

## API

- `buildRobots({ siteUrl, extraSitemaps?, disallow?, allow? })`
- `buildSitemapEntries({ siteUrl, locales, pages, localeInPath? })`
- `buildVideoSitemap({ videos })`, `escapeXml(value)`
- `buildOrganizationJsonLd`, `buildWebPageJsonLd`,
  `buildBreadcrumbJsonLd`, `buildArticleJsonLd`
- `buildPageMetadata({ site, page, locale, pathname, ogImage?, robots?, localeInPath? })`
- `llmsTextResponse({ body })`, `normalizeLlmsBody`, `buildLlmsFull`
- `truncateDescription`, `resolveDescription`, `resolveLocalizedField`
- `normalizeSlug`, `isDraftSlug`

See CATALOG.md for needs-first examples.
