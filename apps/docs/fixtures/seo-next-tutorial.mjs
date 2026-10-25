import {
  buildPageMetadata,
  buildRobots,
  buildSitemapEntries,
  buildWebPageJsonLd,
} from "@zedtech/zedkit-seo";

export const tutorialSite = {
  name: "Example",
  url: "https://example.com",
  defaultLocale: "en",
  locales: ["en"],
};

export const tutorialPage = {
  title: "About",
  description: "About this example site.",
};

export function tutorialRobots() {
  return buildRobots({ siteUrl: tutorialSite.url });
}

export function tutorialSitemap() {
  return buildSitemapEntries({
    siteUrl: tutorialSite.url,
    locales: tutorialSite.locales,
    localeInPath: false,
    pages: [{ path: "" }, { path: "/about" }],
  });
}

export function tutorialMetadata() {
  return buildPageMetadata({
    site: tutorialSite,
    page: tutorialPage,
    locale: "en",
    pathname: "/about",
    localeInPath: false,
    openGraphLocale: "en_US",
  });
}

export function tutorialJsonLd() {
  return buildWebPageJsonLd({
    title: tutorialPage.title,
    description: tutorialPage.description,
    url: `${tutorialSite.url}/about`,
  });
}
