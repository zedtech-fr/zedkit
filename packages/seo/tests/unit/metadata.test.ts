import { describe, expect, it } from "vitest";

import { buildPageMetadata } from "#index.js";

const site = { name: "Example", url: "https://example.com", defaultLocale: "en", locales: ["en", "fr"] };

describe("buildPageMetadata", () => {
  it("builds canonical, alternates, open graph, and robots", () => {
    const meta = buildPageMetadata({
      site,
      page: { title: "Work", description: "Our work.", keywords: ["a", "b"] },
      locale: "fr",
      pathname: "/fr/work",
      ogImage: { url: "https://example.com/og.jpg", width: 1200, height: 630 },
    });
    expect(meta.title).toBe("Work");
    expect(meta.alternates).toEqual({
      canonical: "/fr/work",
      languages: { en: "/en/work", fr: "/fr/work", "x-default": "/en/work" },
    });
    expect(meta.openGraph).toMatchObject({
      type: "website",
      locale: "fr_FR",
      url: "https://example.com/fr/work",
      siteName: "Example",
      images: [{ url: "https://example.com/og.jpg", width: 1200, height: 630, alt: "Example" }],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: ["https://example.com/og.jpg"] });
    expect(meta.robots).toMatchObject({ index: true, follow: true });
    expect(meta.metadataBase).toEqual(new URL("https://example.com"));
  });

  it("maps the home page to the bare locale path with x-default", () => {
    const meta = buildPageMetadata({
      site,
      page: { title: "Home", description: "Home." },
      locale: "en",
      pathname: "/en",
    });
    expect(meta.alternates?.canonical).toBe("/en");
    expect(meta.alternates?.languages?.["x-default"]).toBe("/en");
  });

  it("honors robots overrides", () => {
    const meta = buildPageMetadata({
      site,
      page: { title: "Draft", description: "Draft." },
      locale: "en",
      pathname: "/en/draft",
      robots: { index: false },
    });
    expect(meta.robots).toMatchObject({ index: false, follow: true });
  });

  it("omits locale segments when localeInPath is false", () => {
    const single = { name: "Docs", url: "https://zedkit.app", defaultLocale: "en", locales: ["en"] };
    const meta = buildPageMetadata({
      site: single,
      page: { title: "Button", description: "Button component." },
      locale: "en",
      pathname: "/docs/ui/button",
      localeInPath: false,
      ogImage: { url: "https://zedkit.app/og.png", width: 1200, height: 630 },
    });
    expect(meta.alternates?.canonical).toBe("/docs/ui/button");
    expect(meta.openGraph?.url).toBe("https://zedkit.app/docs/ui/button");
    expect(meta.alternates?.languages).toEqual({ "x-default": "/docs/ui/button" });
  });
});
