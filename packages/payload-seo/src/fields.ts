import type { Field } from "payload";

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 160;

/** Length validator with a friendly message (empty and non-strings pass). */
export function maxLengthValidator(max: number): (value: unknown) => string | true {
  return (value: unknown) => {
    if (typeof value !== "string" || value.length === 0) return true;
    return value.length <= max ? true : `Must be ${max} characters or fewer (now ${value.length}).`;
  };
}

export interface SeoFieldsOptions {
  /** Upload collection for the OG image. Defaults to `"media"`. */
  mediaSlug?: string;
  /** Meta/OG title cap. Defaults to 70. */
  titleMaxLength?: number;
  /** Meta/OG description cap. Defaults to 160. */
  descriptionMaxLength?: number;
  /** Group field name. Defaults to `"seo"`. */
  groupName?: string;
}

/**
 * Localized SEO leaf fields: meta title/description, keywords,
 * canonical URL, OG title/description/image, robots flags.
 */
export function seoFields(options: SeoFieldsOptions = {}): Field[] {
  const mediaSlug = options.mediaSlug ?? "media";
  const titleMax = options.titleMaxLength ?? SEO_TITLE_MAX;
  const descriptionMax = options.descriptionMaxLength ?? SEO_DESCRIPTION_MAX;
  return [
    {
      name: "metaTitle",
      type: "text",
      localized: true,
      maxLength: titleMax,
      validate: maxLengthValidator(titleMax),
      admin: { description: `Search result title (${titleMax} chars max).` },
    },
    {
      name: "metaDescription",
      type: "textarea",
      localized: true,
      maxLength: descriptionMax,
      validate: maxLengthValidator(descriptionMax),
      admin: { description: `Search result snippet (${descriptionMax} chars max).` },
    },
    {
      name: "keywords",
      type: "array",
      localized: true,
      fields: [{ name: "value", type: "text" }],
    },
    {
      name: "canonicalUrl",
      type: "text",
      admin: { description: "Absolute URL; leave empty to use the page URL." },
    },
    {
      name: "ogTitle",
      type: "text",
      localized: true,
      maxLength: titleMax,
      validate: maxLengthValidator(titleMax),
      admin: { description: "Social share title; falls back to the meta title." },
    },
    {
      name: "ogDescription",
      type: "textarea",
      localized: true,
      maxLength: descriptionMax,
      validate: maxLengthValidator(descriptionMax),
      admin: { description: "Social share text; falls back to the meta description." },
    },
    {
      name: "ogImage",
      type: "upload",
      relationTo: mediaSlug,
    },
    {
      name: "robotsNoIndex",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Hide this page from search results (drafts)." },
    },
    {
      name: "robotsNoFollow",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Tell crawlers not to follow this page's links." },
    },
  ];
}

/** The leaf fields wrapped in a group (default name `"seo"`). */
export function seoGroupField(options: SeoFieldsOptions = {}): Field {
  return {
    name: options.groupName ?? "seo",
    type: "group",
    fields: seoFields(options),
  };
}
