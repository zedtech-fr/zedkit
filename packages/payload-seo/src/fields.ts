import type { Field, Validate } from "payload";

import {
  formatMaxLengthMessage,
  resolveLocale,
  SEO_VALIDATION_MESSAGES,
  type SeoValidationMessages,
} from "./validation-messages.js";

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 160;

export type SeoFieldLabelKey =
  | "metaTitle"
  | "metaDescription"
  | "keywords"
  | "canonicalUrl"
  | "ogTitle"
  | "ogDescription"
  | "ogImage"
  | "robotsNoIndex"
  | "robotsNoFollow"
  | "group";

/** Per-field admin labels (`string` or locale map). */
export type SeoFieldLabels = Partial<Record<SeoFieldLabelKey, Record<string, string> | string>>;

export interface SeoFieldsOptions {
  /** Upload collection for the OG image. Defaults to `"media"`. */
  mediaSlug?: string;
  /** Meta/OG title cap. Defaults to 70. */
  titleMaxLength?: number;
  /** Meta/OG description cap. Defaults to 160. */
  descriptionMaxLength?: number;
  /** Group field name. Defaults to `"seo"`. */
  groupName?: string;
  /** Admin labels for leaves and the group (locale maps instead of derived English). */
  labels?: SeoFieldLabels;
  /** Keywords as localized comma-separated text instead of a localized array. */
  keywordsAsText?: boolean;
  /** Validator copy by locale (`{max}` and `{length}` placeholders). */
  validationMessages?: SeoValidationMessages;
}

function withLabel<T extends Field>(field: T, labels: SeoFieldLabels | undefined, key: SeoFieldLabelKey): T {
  const label = labels?.[key];
  if (label === undefined) return field;
  return { ...field, label };
}

/** Length validator with locale-aware messages (empty and non-strings pass). */
export function maxLengthValidator(
  max: number,
  messages: Record<string, string> = SEO_VALIDATION_MESSAGES.maxLength,
): Validate<string> {
  return (value, { req }) => {
    if (typeof value !== "string" || value.length === 0) return true;
    if (value.length <= max) return true;
    const locale = resolveLocale(req);
    const template = messages[locale] ?? messages.en ?? SEO_VALIDATION_MESSAGES.maxLength.en;
    return formatMaxLengthMessage(template, max, value.length);
  };
}

function keywordsField(options: SeoFieldsOptions): Field {
  if (options.keywordsAsText) {
    return withLabel(
      {
        name: "keywords",
        type: "text",
        localized: true,
        admin: { description: "Comma-separated keywords for this locale." },
      },
      options.labels,
      "keywords",
    );
  }
  return withLabel(
    {
      name: "keywords",
      type: "array",
      localized: true,
      fields: [{ name: "value", type: "text" }],
    },
    options.labels,
    "keywords",
  );
}

/**
 * Localized SEO leaf fields: meta title/description, keywords,
 * canonical URL, OG title/description/image, robots flags.
 */
export function seoFields(options: SeoFieldsOptions = {}): Field[] {
  const mediaSlug = options.mediaSlug ?? "media";
  const titleMax = options.titleMaxLength ?? SEO_TITLE_MAX;
  const descriptionMax = options.descriptionMaxLength ?? SEO_DESCRIPTION_MAX;
  const maxLengthMessages = {
    ...SEO_VALIDATION_MESSAGES.maxLength,
    ...options.validationMessages?.maxLength,
  };
  const labels = options.labels;

  return [
    withLabel(
      {
        name: "metaTitle",
        type: "text",
        localized: true,
        maxLength: titleMax,
        validate: maxLengthValidator(titleMax, maxLengthMessages),
        admin: { description: `Search result title (${titleMax} chars max).` },
      },
      labels,
      "metaTitle",
    ),
    withLabel(
      {
        name: "metaDescription",
        type: "textarea",
        localized: true,
        maxLength: descriptionMax,
        validate: maxLengthValidator(descriptionMax, maxLengthMessages),
        admin: { description: `Search result snippet (${descriptionMax} chars max).` },
      },
      labels,
      "metaDescription",
    ),
    keywordsField(options),
    withLabel(
      {
        name: "canonicalUrl",
        type: "text",
        admin: { description: "Absolute URL; leave empty to use the page URL." },
      },
      labels,
      "canonicalUrl",
    ),
    withLabel(
      {
        name: "ogTitle",
        type: "text",
        localized: true,
        maxLength: titleMax,
        validate: maxLengthValidator(titleMax, maxLengthMessages),
        admin: { description: "Social share title; falls back to the meta title." },
      },
      labels,
      "ogTitle",
    ),
    withLabel(
      {
        name: "ogDescription",
        type: "textarea",
        localized: true,
        maxLength: descriptionMax,
        validate: maxLengthValidator(descriptionMax, maxLengthMessages),
        admin: { description: "Social share text; falls back to the meta description." },
      },
      labels,
      "ogDescription",
    ),
    withLabel(
      {
        name: "ogImage",
        type: "upload",
        relationTo: mediaSlug,
      },
      labels,
      "ogImage",
    ),
    withLabel(
      {
        name: "robotsNoIndex",
        type: "checkbox",
        defaultValue: false,
        admin: { description: "Hide this page from search results (drafts)." },
      },
      labels,
      "robotsNoIndex",
    ),
    withLabel(
      {
        name: "robotsNoFollow",
        type: "checkbox",
        defaultValue: false,
        admin: { description: "Tell crawlers not to follow this page's links." },
      },
      labels,
      "robotsNoFollow",
    ),
  ];
}

/** The leaf fields wrapped in a group (default name `"seo"`). */
export function seoGroupField(options: SeoFieldsOptions = {}): Field {
  const group: Field = {
    name: options.groupName ?? "seo",
    type: "group",
    fields: seoFields(options),
  };
  const groupLabel = options.labels?.group;
  if (groupLabel !== undefined) {
    return { ...group, label: groupLabel };
  }
  return group;
}
