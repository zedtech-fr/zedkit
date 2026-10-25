# Catalog — @zedtech/zedkit-payload-seo

- Keywords: payloadcms, payload, seo, cms, meta-tags, json-ld, open-graph, localization, i18n, nextjs, typescript
- Audience: Payload CMS developers shipping localized marketing sites.
- Purpose: Drop-in localized SEO group field: meta tags, JSON-LD and length validation, ready for i18n sites.


## Add a localized SEO tab to a Payload collection

- Import: `@zedtech/zedkit-payload-seo` — `seoGroupField`, `seoFields`, `SeoFieldsOptions`
- Wraps: `payload` (peer, types only)
- Status: beta
- Short name: SEO group field
- Audience: Payload CMS developers shipping localized marketing sites.
- Purpose: A drop-in SEO group field (meta, OG, robots, JSON-LD) with localization and length validation.
- When to use: On every collection with public pages in more than one locale.
- When not to use: For a single-locale site — use plain text fields plus `zedkit-seo` builders instead.
- See also: `Validate editor-entered title/description lengths`, `Build localized page metadata`

```ts
import { seoGroupField } from "@zedtech/zedkit-payload-seo";
fields: [seoGroupField({ mediaSlug: "media" })]
// meta/OG/robots leaves, localized, length-validated
```

## Validate editor-entered title/description lengths

- Import: `@zedtech/zedkit-payload-seo` — `maxLengthValidator`, `SEO_TITLE_MAX`, `SEO_DESCRIPTION_MAX`
- Wraps: `(none)`
- Status: beta
- Short name: Length validation
- Audience: Payload developers who want editors warned before over-long titles ship.
- Purpose: Friendly max-length validators and constants for SEO titles and descriptions.
- When to use: On every editor-entered SEO text field.
- When not to use: For hard truncation at render time — use `resolveDescription` from `@zedtech/zedkit-seo` instead.
- See also: `Add a localized SEO tab to a Payload collection`, `Derive descriptions, slugs, and localized fields`

```ts
import { SEO_TITLE_MAX, maxLengthValidator } from "@zedtech/zedkit-payload-seo";
validate: maxLengthValidator(SEO_TITLE_MAX)
// true when fine, friendly message when over
```
