import type { Field, PayloadRequest, ValidateOptions } from "payload";
import { describe, expect, it } from "vitest";

import { maxLengthValidator, seoFields, seoGroupField } from "#index.js";
import { SEO_VALIDATION_MESSAGES } from "#validation-messages.js";

function byName(fields: Field[], name: string): Field & { [key: string]: unknown } {
  const found = fields.find((field) => "name" in field && field.name === name);
  if (found === undefined) throw new Error(`missing field ${name}`);
  return found as Field & { [key: string]: unknown };
}

function mockReq(locale: string): PayloadRequest {
  return { locale } as PayloadRequest;
}

function validateCtx(locale: string): ValidateOptions<unknown, unknown, object, string> {
  return { req: mockReq(locale) } as ValidateOptions<unknown, unknown, object, string>;
}

const ctxEn = validateCtx("en");
const ctxFr = validateCtx("fr");

describe("maxLengthValidator", () => {
  it("passes empty and short values, fails long ones in English", () => {
    const validate = maxLengthValidator(3);
    expect(validate(null, ctxEn)).toBe(true);
    expect(validate(undefined, ctxEn)).toBe(true);
    expect(validate("", ctxEn)).toBe(true);
    expect(validate(42 as never, ctxEn)).toBe(true);
    expect(validate("abc", ctxEn)).toBe(true);
    expect(validate("abcd", ctxEn)).toBe("Must be 3 characters or fewer (now 4).");
  });

  it("keeps working when called directly without Payload options", () => {
    const validate = maxLengthValidator(3);
    expect(validate("abc")).toBe(true);
    expect(validate("abcd")).toBe("Must be 3 characters or fewer (now 4).");
    expect(validate("abcd", {})).toBe("Must be 3 characters or fewer (now 4).");
  });

  it("uses French copy when req.locale is fr", () => {
    const validate = maxLengthValidator(3);
    expect(validate("abcd", ctxFr)).toBe("Maximum 3 caractères (actuellement 4).");
  });

  it("honors custom locale messages", () => {
    const validate = maxLengthValidator(2, { de: "Max {max}, ist {length}." });
    expect(validate("abc", validateCtx("de"))).toBe("Max 2, ist 3.");
  });
});

describe("seoFields", () => {
  it("returns the localized, validated leaf set", () => {
    const fields = seoFields();
    expect(fields.map((field) => ("name" in field ? field.name : "?"))).toEqual([
      "metaTitle",
      "metaDescription",
      "keywords",
      "canonicalUrl",
      "ogTitle",
      "ogDescription",
      "ogImage",
      "robotsNoIndex",
      "robotsNoFollow",
    ]);
    expect(byName(fields, "metaTitle")).toMatchObject({ type: "text", localized: true, maxLength: 70 });
    expect(byName(fields, "metaDescription")).toMatchObject({
      type: "textarea",
      localized: true,
      maxLength: 160,
    });
    expect(byName(fields, "keywords")).toMatchObject({ type: "array", localized: true });
    expect(byName(fields, "ogImage")).toMatchObject({ type: "upload", relationTo: "media" });
    expect(byName(fields, "robotsNoIndex")).toMatchObject({ type: "checkbox", defaultValue: false });
  });

  it("honors option overrides", () => {
    const fields = seoFields({ mediaSlug: "assets", titleMaxLength: 60, descriptionMaxLength: 150 });
    expect(byName(fields, "ogImage")).toMatchObject({ relationTo: "assets" });
    expect(byName(fields, "ogTitle")).toMatchObject({ maxLength: 60 });
    expect(byName(fields, "ogDescription")).toMatchObject({ maxLength: 150 });
  });

  it("applies per-locale labels and keywords-as-text leaves", () => {
    const fields = seoFields({
      labels: {
        metaTitle: { en: "Title", fr: "Titre" },
        group: { en: "SEO" },
      },
      keywordsAsText: true,
    });
    expect(byName(fields, "metaTitle").label).toEqual({ en: "Title", fr: "Titre" });
    expect(byName(fields, "keywords")).toMatchObject({ type: "text", localized: true });
  });

  it("merges validationMessages into max-length errors", () => {
    const fields = seoFields({
      validationMessages: { maxLength: { en: "Too long ({length}/{max})." } },
    });
    const validate = byName(fields, "metaTitle").validate as ReturnType<typeof maxLengthValidator>;
    expect(validate("x".repeat(71), ctxEn)).toBe("Too long (71/70).");
    expect(SEO_VALIDATION_MESSAGES.maxLength.fr).toContain("caractères");
  });
});

describe("seoGroupField", () => {
  it("wraps the leaves in a group", () => {
    expect(seoGroupField()).toMatchObject({ name: "seo", type: "group" });
    expect(seoGroupField({ groupName: "meta" })).toMatchObject({ name: "meta", type: "group" });
    expect(seoGroupField({ labels: { group: { en: "SEO", fr: "Référencement" } } })).toMatchObject({
      label: { en: "SEO", fr: "Référencement" },
    });
  });
});
