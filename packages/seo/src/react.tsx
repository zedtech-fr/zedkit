import type { JSX } from "react";

/**
 * Builder output or a CMS-shaped blob. `data` stays `object` so FAQPage
 * and other non-builder graphs type-check without a wrapper.
 */
export interface JsonLdProps {
  data: object;
}

/** Emits `<script type="application/ld+json">` with `<` escaped as `\u003c`. */
export function JsonLd({ data }: JsonLdProps): JSX.Element {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
