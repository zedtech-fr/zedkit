# @zedtech/zedkit-payload-seo

Localized Payload SEO group field with length validation.
Original work by the same author.

```sh
pnpm add @zedtech/zedkit-payload-seo
```

```ts
import { seoGroupField } from "@zedtech/zedkit-payload-seo";

export const Page = {
  slug: "pages",
  fields: [/* ... */, seoGroupField()],
};
```

`seoFields()` returns the nine leaf fields (meta title/description,
keywords, canonical URL, OG title/description/image, robots
noindex/nofollow); `seoGroupField()` wraps them in a group (default
name `"seo"`). Text lengths are capped (70/160) with friendly
validator messages; the OG image uploads to your media collection
(`mediaSlug` option). Pair with `@zedtech/zedkit-seo` to turn stored values
into metadata, sitemaps, and JSON-LD.
