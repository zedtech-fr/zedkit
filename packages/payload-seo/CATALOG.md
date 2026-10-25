# Catalog — @zedkit/payload-seo

## Add a localized SEO tab to a Payload collection

- Import: `@zedkit/payload-seo` — `seoGroupField`, `seoFields`, `SeoFieldsOptions`
- Wraps: `payload` (peer, types only)
- Status: beta

```ts
import { seoGroupField } from "@zedkit/payload-seo";
fields: [seoGroupField({ mediaSlug: "media" })]
// meta/OG/robots leaves, localized, length-validated
```

## Validate editor-entered title/description lengths

- Import: `@zedkit/payload-seo` — `maxLengthValidator`, `SEO_TITLE_MAX`, `SEO_DESCRIPTION_MAX`
- Wraps: `(none)`
- Status: beta

```ts
import { SEO_TITLE_MAX, maxLengthValidator } from "@zedkit/payload-seo";
validate: maxLengthValidator(SEO_TITLE_MAX)
// true when fine, friendly message when over
```
