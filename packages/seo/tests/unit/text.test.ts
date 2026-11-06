import { describe, expect, it } from "vitest";

import {
  isDraftSlug,
  normalizeSlug,
  resolveDescription,
  resolveLocalizedField,
  truncateDescription,
} from "#index.js";

describe("truncateDescription", () => {
  it("collapses whitespace and caps at 160 with an ellipsis", () => {
    expect(truncateDescription("  Hello   world  ")).toBe("Hello world");
    const long = `x${"y".repeat(200)}`;
    const cut = truncateDescription(long);
    expect(cut.length).toBe(160);
    expect(cut.endsWith("…")).toBe(true);
  });

  it("keeps complete sentences instead of cutting mid-sentence", () => {
    const text = `Design your own look on a live card. ${"Then copy the tokens into your app and keep going. ".repeat(6)}`;
    const cut = truncateDescription(text);
    expect(cut.endsWith("…")).toBe(false);
    expect(cut.endsWith(".")).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(160);
    expect(cut.startsWith("Design your own look on a live card.")).toBe(true);
  });

  it("keeps a sentence that ends exactly at the cap", () => {
    const sentence = `${"a".repeat(159)}.`;
    expect(truncateDescription(`${sentence} More follows here.`)).toBe(sentence);
  });

  it("does not cut at abbreviations or decimals", () => {
    const text = `Pairs below 4.5:1 warn, e.g. light text on light ground. ${"Fix nudges lightness until the pair passes. ".repeat(5)}`;
    const cut = truncateDescription(text);
    expect(cut.startsWith("Pairs below 4.5:1 warn, e.g. light text on light ground.")).toBe(true);
    expect(cut.endsWith(".")).toBe(true);
  });
});

describe("resolveLocalizedField", () => {
  it("prefers the exact locale, then fallbacks, then first", () => {
    const value = { fr: "Bonjour", en: "Hello" };
    expect(resolveLocalizedField(value, "fr")).toBe("Bonjour");
    expect(resolveLocalizedField(value, "de", ["en"])).toBe("Hello");
    expect(resolveLocalizedField({ fr: "Bonjour" }, "de", [])).toBe("Bonjour");
    expect(resolveLocalizedField("Plain", "fr")).toBe("Plain");
    expect(resolveLocalizedField(null, "fr")).toBe("");
  });
});

describe("resolveDescription", () => {
  it("chains custom, body text, then title", () => {
    expect(resolveDescription({ custom: "Custom.", bodyText: "Body.", title: "Title" })).toBe("Custom.");
    expect(resolveDescription({ bodyText: "Body.", title: "Title" })).toBe("Body.");
    expect(resolveDescription({ title: { fr: "Titre" } }, "fr")).toBe("Titre");
    expect(resolveDescription({})).toBe("");
  });
});

describe("normalizeSlug", () => {
  it("lowercases, dashes, and strips accents", () => {
    expect(normalizeSlug("  Café au Lait!! ")).toBe("cafe-au-lait");
  });
});

describe("isDraftSlug", () => {
  it("flags empty and placeholder slugs", () => {
    expect(isDraftSlug(null)).toBe(true);
    expect(isDraftSlug("")).toBe(true);
    expect(isDraftSlug("untitled")).toBe(true);
    expect(isDraftSlug("untitled-4")).toBe(true);
    expect(isDraftSlug("draft-2")).toBe(true);
    expect(isDraftSlug("my-post")).toBe(false);
  });
});
