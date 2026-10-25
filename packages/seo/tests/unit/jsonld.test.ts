import { describe, expect, it } from "vitest";

import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
} from "#index.js";

describe("jsonld", () => {
  it("builds an organization node with an id anchor", () => {
    expect(
      buildOrganizationJsonLd({ name: "Example", url: "https://example.com/", sameAs: ["https://x.example.com"] }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      name: "Example",
      url: "https://example.com/",
      sameAs: ["https://x.example.com"],
    });
  });

  it("builds a web page node with an optional breadcrumb", () => {
    const breadcrumb = buildBreadcrumbJsonLd([{ name: "Home", url: "https://example.com/en" }]);
    const page = buildWebPageJsonLd({
      title: "T",
      description: "D",
      url: "https://example.com/en",
      breadcrumb,
    });
    expect(page["@type"]).toBe("WebPage");
    expect(page.breadcrumb).toBe(breadcrumb);
  });

  it("numbers breadcrumb positions from 1", () => {
    const list = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://example.com/en" },
      { name: "Work", url: "https://example.com/en/work" },
    ]);
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://example.com/en" },
      { "@type": "ListItem", position: 2, name: "Work", item: "https://example.com/en/work" },
    ]);
  });

  it("builds an article node with person author and image", () => {
    const article = buildArticleJsonLd({
      title: "T",
      description: "D",
      url: "https://example.com/en/post",
      datePublished: "2026-01-02",
      authorName: "Ada",
      imageUrl: "https://example.com/i.jpg",
    });
    expect(article).toMatchObject({
      "@type": "Article",
      headline: "T",
      author: { "@type": "Person", name: "Ada" },
      image: "https://example.com/i.jpg",
    });
  });
});
