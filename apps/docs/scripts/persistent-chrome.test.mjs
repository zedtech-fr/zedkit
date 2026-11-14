import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("root provider mounts PersistentShell once around route children, not the identity dock", () => {
  const provider = read("app/provider.tsx");
  const host = read("components/site-chrome/site-persistent-chrome.tsx");
  assert.match(provider, /SitePersistentChrome/);
  assert.match(provider, /<SitePersistentChrome>\s*\{children\}\s*<\/SitePersistentChrome>/);
  assert.match(provider, /IdentityDockGate/);
  assert.doesNotMatch(provider, /dock=/);
  assert.doesNotMatch(provider, /PersistentShell/);
  assert.match(host, /from ["']@zedtech\/zedkit-ui["']/);
  assert.match(host, /PersistentShell/);
  assert.match(host, /data-slot="persistent-shell"|<PersistentShell/);
  assert.match(host, /header=\{/);
  assert.doesNotMatch(host, /dock=/);
  assert.doesNotMatch(host, /sidebar=/);
  assert.doesNotMatch(host, /IdentityDock/);
});

test("nested layouts do not mount a second desktop #nd-nav host", () => {
  const home = read("app/(home)/layout.tsx");
  const site = read("app/(site)/layout.tsx");
  const siteLayout = read("components/site-chrome/site-layout.tsx");
  const docs = read("app/docs/[[...slug]]/layout.tsx");
  const run = read("app/(run-console)/layout.tsx");
  const host = read("components/site-chrome/site-persistent-chrome.tsx");
  assert.doesNotMatch(home, /HomeMarketingHeader|DocsDesktopHeader|MarketingSiteHeader|#nd-nav/);
  assert.doesNotMatch(site, /HomeMarketingHeader|DocsDesktopHeader|MarketingSiteHeader|#nd-nav/);
  assert.match(siteLayout, /enabled:\s*false/);
  assert.doesNotMatch(siteLayout, /HomeMarketingHeader|MarketingSiteHeader|#nd-nav/);
  assert.doesNotMatch(docs, /DocsDesktopHeader/);
  assert.doesNotMatch(docs, /#nd-nav/);
  assert.match(docs, /DocsSiteHeader/);
  assert.doesNotMatch(docs, /PageTransition|PersistentShell/);
  assert.doesNotMatch(run, /SiteLayout|SitePersistentChrome|#nd-nav/);
  assert.match(host, /MarketingDesktopNav/);
  assert.match(host, /siteDesktopHeaderKind/);
  assert.match(host, /MobileHeader/);
  assert.match(host, /HomeGetStartedAction/);
  assert.match(host, /SiteSearchTrigger className="lg:hidden"/);
  assert.match(host, /SiteFullSearchTrigger className="max-lg:hidden"/);
  assert.match(host, /HomeGitHubLink/);
});

test("docs article settle lives in the main grid area, not around DocsLayout children", () => {
  const main = read("app/docs/[[...slug]]/_docs/docs-main-content.tsx");
  const layout = read("app/docs/[[...slug]]/layout.tsx");
  assert.match(main, /PageTransition/);
  assert.match(main, /preset="settle"/);
  assert.match(main, /routeKey=\{pathname\}/);
  assert.match(main, /id="main-content"/);
  assert.match(main, /\[grid-area:main\]/);
  assert.doesNotMatch(layout, /PageTransition/);
  assert.doesNotMatch(layout, /PersistentShell/);
});

test("docs loading.tsx is a named DocsPageSkeleton in the article column", () => {
  const loading = read("app/docs/[[...slug]]/loading.tsx");
  assert.match(loading, /DocsPageSkeleton/);
  assert.match(loading, /siteChromeCopy\.loading\.page/);
  assert.match(loading, /\[grid-area:main\]|DocsMainContent/);
  assert.doesNotMatch(loading, /Spinner|animate-spin/);
  assert.doesNotMatch(loading, /Loading catalog/);
});

test("catalog and issues waits are list/detail skeletons, not a loading sentence as the page", () => {
  const catalogLoading = read("app/(site)/catalog/loading.tsx");
  const issuesLoading = read("app/(site)/issues/loading.tsx");
  const issueLoading = read("app/(site)/issues/[n]/loading.tsx");
  const catalogPage = read("app/(site)/catalog/page.tsx");
  const prefetch = read("components/site-chrome/docs-app-link.tsx");
  assert.match(catalogLoading, /ListPageSkeleton/);
  assert.match(catalogLoading, /catalogCopy\.loading/);
  assert.match(issuesLoading, /ListPageSkeleton/);
  assert.match(issuesLoading, /siteChromeCopy\.loading\.issues/);
  assert.match(issueLoading, /DetailPageSkeleton/);
  assert.match(issueLoading, /siteChromeCopy\.loading\.issue/);
  assert.match(catalogPage, /<ListPageSkeleton/);
  assert.match(catalogPage, /label=\{catalogCopy\.loading\}/);
  assert.doesNotMatch(catalogPage, />\s*\{catalogCopy\.loading\}\s*</);
  assert.match(prefetch, /const resolved = prefetch \?\? false;/);
});
