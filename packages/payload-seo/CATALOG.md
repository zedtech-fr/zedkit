# Catalog — @zedtech/zedkit-payload-seo

- Keywords: payloadcms, payload, seo, cms, meta-tags, json-ld, open-graph, localization, i18n, nextjs, typescript
- Audience: Payload CMS developers shipping localized marketing sites.
- Purpose: Drop-in localized SEO group field: meta tags, JSON-LD and length validation, ready for i18n sites.


## Add a localized SEO tab to a Payload collection

- Import: `@zedtech/zedkit-payload-seo` — `seoGroupField`, `seoFields`, `SeoFieldsOptions`
- Wraps: `payload` (peer, types only)
- Status: beta

```ts
import { seoGroupField } from "@zedtech/zedkit-payload-seo";
fields: [seoGroupField({ mediaSlug: "media" })]
// meta/OG/robots leaves, localized, length-validated
```

## Validate editor-entered title/description lengths

- Import: `@zedtech/zedkit-payload-seo` — `maxLengthValidator`, `SEO_TITLE_MAX`, `SEO_DESCRIPTION_MAX`
- Wraps: `(none)`
- Status: beta

```ts
import { SEO_TITLE_MAX, maxLengthValidator } from "@zedtech/zedkit-payload-seo";
validate: maxLengthValidator(SEO_TITLE_MAX)
// true when fine, friendly message when over
```
