# Catalog — @zedkit/seo

## Serve robots.txt content

- Import: `@zedkit/seo` — `buildRobots`, `BuildRobotsOptions`, `RobotsConfig`
- Wraps: `(none)`
- Status: stable

```ts
import { buildRobots } from "@zedkit/seo";
export function robots() {
  return buildRobots({ siteUrl, extraSitemaps: [`${siteUrl}/video-sitemap.xml`] });
}
```

## List localized pages in a sitemap

- Import: `@zedkit/seo` — `buildSitemapEntries`, `BuildSitemapOptions`, `SitemapEntry`, `SitemapPage`
- Wraps: `(none)`
- Status: stable

```ts
import { buildSitemapEntries } from "@zedkit/seo";
const pages = docs.map((d) => ({ path: `/${d.slug}`, lastModified: d.updatedAt }));
return buildSitemapEntries({ siteUrl, locales: ["en", "fr"], pages });
```

## Serve a Google video sitemap

- Import: `@zedkit/seo` — `buildVideoSitemap`, `BuildVideoSitemapOptions`, `VideoSitemapEntry`, `escapeXml`
- Wraps: `(none)`
- Status: stable

```ts
import { buildVideoSitemap } from "@zedkit/seo";
const xml = buildVideoSitemap({ videos: [{ pageUrl, thumbnailUrl, title, description }] });
return new Response(xml, { headers: { "Content-Type": "application/xml" } });
```

## Emit typed JSON-LD structured data

- Import: `@zedkit/seo` — `buildOrganizationJsonLd`, `buildWebPageJsonLd`, `buildBreadcrumbJsonLd`, `buildArticleJsonLd`, `OrganizationJsonLdOptions`, `WebPageJsonLdOptions`, `BreadcrumbItem`, `ArticleJsonLdOptions`
- Wraps: `schema-dts`
- Status: stable

```ts
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@zedkit/seo";
const jsonLd = buildArticleJsonLd({ title, description, url, datePublished });
<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
```

## Build localized page metadata

- Import: `@zedkit/seo` — `buildPageMetadata`, `BuildPageMetadataOptions`, `SiteMetadata`, `PageContent`, `PageMetadata`, `OpenGraphImage`
- Wraps: `(none)`
- Status: stable

```ts
import { buildPageMetadata } from "@zedkit/seo";
return buildPageMetadata({ site, page, locale, pathname, ogImage });
```

## Serve llms.txt for AI agents

- Import: `@zedkit/seo` — `llmsTextResponse`, `LlmsTextResponseOptions`, `normalizeLlmsBody`, `buildLlmsFull`, `LlmsFullSection`
- Wraps: `(none)`
- Status: stable

```ts
import { llmsTextResponse } from "@zedkit/seo";
export async function GET() {
  const settings = await loadSettings();
  return llmsTextResponse({ body: settings.llmsTxt ?? "" });
}
```

## Derive descriptions, slugs, and localized fields

- Import: `@zedkit/seo` — `truncateDescription`, `SEO_DESCRIPTION_MAX`, `resolveDescription`, `DescriptionSource`, `resolveLocalizedField`, `LocalizedField`, `normalizeSlug`, `isDraftSlug`
- Wraps: `(none)`
- Status: stable

```ts
import { normalizeSlug, resolveDescription } from "@zedkit/seo";
const slug = normalizeSlug(title);
const description = resolveDescription({ custom: seo.metaDescription, bodyText, title });
```
