import { describe, expect, it } from "vitest";

import { buildSitemapEntries } from "#index.js";

describe("buildSitemapEntries", () => {
  it("prefixes every page with every locale", () => {
    expect(
      buildSitemapEntries({
        siteUrl: "https://example.com/",
        locales: ["en", "fr"],
        pages: [
          { path: "", changeFrequency: "daily", priority: 1 },
          { path: "/work/slug", lastModified: "2026-01-02", priority: 0.7 },
        ],
      }),
    ).toEqual([
      { url: "https://example.com/en", changeFrequency: "daily", priority: 1 },
      {
        url: "https://example.com/en/work/slug",
        lastModified: "2026-01-02",
        priority: 0.7,
      },
      { url: "https://example.com/fr", changeFrequency: "daily", priority: 1 },
      {
        url: "https://example.com/fr/work/slug",
        lastModified: "2026-01-02",
        priority: 0.7,
      },
    ]);
  });

  it("lists each page once without locale prefixes when localeInPath is false", () => {
    expect(
      buildSitemapEntries({
        siteUrl: "https://zedkit.app",
        locales: ["en"],
        localeInPath: false,
        pages: [{ path: "" }, { path: "/docs/ui/button" }],
      }),
    ).toEqual([
      { url: "https://zedkit.app/" },
      { url: "https://zedkit.app/docs/ui/button" },
    ]);
  });
});
