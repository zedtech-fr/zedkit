import { describe, expect, it } from "vitest";

import { buildRobots } from "#index.js";

describe("buildRobots", () => {
  it("allows the site and points at the sitemap", () => {
    expect(buildRobots({ siteUrl: "https://example.com/" })).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: "/admin/" },
      sitemap: "https://example.com/sitemap.xml",
    });
  });

  it("adds extra sitemaps and honors overrides", () => {
    const robots = buildRobots({
      siteUrl: "https://example.com",
      extraSitemaps: ["https://example.com/video-sitemap.xml"],
      disallow: ["/admin/", "/drafts/"],
    });
    expect(robots.sitemap).toEqual([
      "https://example.com/sitemap.xml",
      "https://example.com/video-sitemap.xml",
    ]);
    expect(robots.rules).toMatchObject({ disallow: ["/admin/", "/drafts/"] });
  });
});
