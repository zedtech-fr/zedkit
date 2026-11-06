import assert from "node:assert/strict";

import {
  tutorialJsonLd,
  tutorialMetadata,
  tutorialPage,
  tutorialRobots,
  tutorialSitemap,
  tutorialSite,
} from "../fixtures/seo-next-tutorial.mjs";

const robots = tutorialRobots();
assert.ok(robots.sitemap, "robots must reference a sitemap");

const sitemap = tutorialSitemap();
assert.ok(sitemap.length >= 2, "sitemap must list home and /about");
assert.ok(
  sitemap.every((entry) => entry.url.startsWith(tutorialSite.url)),
  "sitemap URLs must stay on the tutorial site",
);

const meta = tutorialMetadata();
assert.equal(meta.title, tutorialPage.title);
assert.ok(meta.openGraph?.url?.includes("/about"), "openGraph url must match the page");

const jsonLd = tutorialJsonLd();
assert.equal(jsonLd["@type"], "WebPage");
assert.equal(jsonLd.url, `${tutorialSite.url}/about`);

console.log("seo-tutorial: ok");
