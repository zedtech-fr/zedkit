import { describe, expect, it } from "vitest";

import { buildVideoSitemap, escapeXml } from "#index.js";

describe("escapeXml", () => {
  it("escapes the five predefined entities", () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe("a&amp;b&lt;c&gt;d&quot;e&apos;f");
  });
});

describe("buildVideoSitemap", () => {
  it("builds namespaced entries with optional tags", () => {
    const xml = buildVideoSitemap({
      videos: [
        {
          pageUrl: "https://example.com/en/work/slug",
          thumbnailUrl: "https://example.com/thumb.jpg",
          title: "Title & more",
          description: "Body",
          contentUrl: "https://example.com/video.mp4",
          publicationDate: "2026-01-02",
        },
        {
          pageUrl: "https://example.com/en/other",
          thumbnailUrl: "https://example.com/t2.jpg",
          title: "Hosted",
          description: "Body",
          playerUrl: "https://player.example.com/v/1",
          familyFriendly: false,
        },
      ],
    });
    expect(xml).toContain("<video:title>Title &amp; more</video:title>");
    expect(xml).toContain("<video:content_loc>https://example.com/video.mp4</video:content_loc>");
    expect(xml).toContain('<video:player_loc allow_embed="yes">https://player.example.com/v/1</video:player_loc>');
    expect(xml).toContain("<video:publication_date>2026-01-02</video:publication_date>");
    expect(xml).toContain("<video:family_friendly>no</video:family_friendly>");
    expect(xml).toContain('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"');
  });
});
