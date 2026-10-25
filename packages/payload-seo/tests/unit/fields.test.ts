import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { maxLengthValidator, seoFields, seoGroupField } from "#index.js";

function byName(fields: Field[], name: string): Field & { [key: string]: unknown } {
  const found = fields.find((field) => "name" in field && field.name === name);
  if (found === undefined) throw new Error(`missing field ${name}`);
  return found as Field & { [key: string]: unknown };
}

describe("maxLengthValidator", () => {
  it("passes empty and short values, fails long ones", () => {
    const validate = maxLengthValidator(3);
    expect(validate(null)).toBe(true);
    expect(validate(undefined)).toBe(true);
    expect(validate("")).toBe(true);
    expect(validate(42)).toBe(true);
    expect(validate("abc")).toBe(true);
    expect(validate("abcd")).toBe("Must be 3 characters or fewer (now 4).");
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
    expect(byName(fields, "ogImage")).toMatchObject({ type: "upload", relationTo: "media" });
    expect(byName(fields, "robotsNoIndex")).toMatchObject({ type: "checkbox", defaultValue: false });
  });

  it("honors option overrides", () => {
    const fields = seoFields({ mediaSlug: "assets", titleMaxLength: 60, descriptionMaxLength: 150 });
    expect(byName(fields, "ogImage")).toMatchObject({ relationTo: "assets" });
    expect(byName(fields, "ogTitle")).toMatchObject({ maxLength: 60 });
    expect(byName(fields, "ogDescription")).toMatchObject({ maxLength: 150 });
  });
});

describe("seoGroupField", () => {
  it("wraps the leaves in a group", () => {
    expect(seoGroupField()).toMatchObject({ name: "seo", type: "group" });
    expect(seoGroupField({ groupName: "meta" })).toMatchObject({ name: "meta", type: "group" });
  });
});
