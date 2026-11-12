import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

test("home hero dashboard loads the admin demo through next/dynamic", () => {
  const src = readFileSync(join(app, "ui/home/home-hero-app.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.match(src, /components\/demos\/registry/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/home-admin-dashboard-demo["']/);
  assert.doesNotMatch(src, /from ["']@\/components\/home-gallery-demos["']/);
});

test("home gallery loads overlay demos through next/dynamic", () => {
  const src = readFileSync(join(app, "components/home-gallery-demos.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/confirm-dialog-demo["']/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/drawer-demo["']/);
  assert.match(src, /home-gallery-preview/);
  assert.doesNotMatch(src, /home-admin-dashboard-demo/);
});

test("search dialog is lazy and not preloaded on every page", () => {
  const src = readFileSync(join(app, "app/provider.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.match(src, /preload:\s*false/);
  assert.doesNotMatch(src, /from ["']\.\.\/components\/search["']/);
});

test("home hero lead is the joint title, one map Setup entry, no kit tabs (#111, #114)", () => {
  const lead = readFileSync(join(app, "ui/home/home-hero-lead.tsx"), "utf8");
  const actions = readFileSync(join(app, "ui/home/home-hero-lead-actions.tsx"), "utf8");
  const copy = readFileSync(join(app, "ui/home/i18n/home-hero-copy.ts"), "utf8");
  const nav = readFileSync(join(app, "lib/site-nav-data.ts"), "utf8");
  assert.match(copy, /title: "Code that's checked\. Screens that match\."/);
  assert.match(
    copy,
    /sub: "Paste one prompt in the agent you already use\. It reads the repo and writes the setup\."/,
  );
  assert.match(copy, /setup: "Setup"/);
  assert.doesNotMatch(copy, /setupAi: "Set up AI"/);
  assert.match(lead, /HomeHeroLeadActions/);
  assert.match(lead, /typeRole="lead"/);
  assert.match(lead, /data-home-hero-sub/);
  assert.match(lead, /MAP_SETUP_MINI_PROMPT/);
  assert.doesNotMatch(lead, /AI_SETUP_MINI_PROMPT/);
  assert.match(lead, /\bmultiline\b/);
  assert.match(lead, /data-home-hero-prompt/);
  assert.doesNotMatch(lead + actions, /\bTabs\b/);
  assert.doesNotMatch(lead + actions, /SetupEntryPrompt/);
  assert.doesNotMatch(lead + actions, /\/issues\/108/);
  assert.doesNotMatch(lead + actions + copy, /\bAI \+ UI\b/);
  assert.match(
    lead,
    /<SecretField[\s\S]*homeCopy\.hero\.promptCaption[\s\S]*<HomeHeroLeadActions issuesHref=\{issuesHref\} \/>[\s\S]*homeCopy\.hero\.facts/,
  );
  assert.match(lead, /from "@\/features\/reviews\/compose"/);
  assert.match(lead, /publicIssueHref/);
  assert.match(actions, /from "@\/ui\/home\/home-link"/);
  assert.match(actions, /from "@\/ui\/off-path-link"/);
  // Primary Setup (near-black site-action), Get started outline site-action, quiet catalog, then off-path issues.
  assert.match(
    actions,
    /<Button asChild data-site-action="">\s*\n\s*<HomeLink href="#ai-setup">\{homeCopy\.heroActions\.setup\}/,
  );
  assert.match(
    actions,
    /variant="outline"[^>]*data-site-action[^>]*>\s*\n\s*<HomeLink href="#get-started">\{homeCopy\.heroActions\.getStarted\}/,
  );
  assert.match(actions, /variant="link"[^>]*>\s*\n\s*<HomeLink href="\/catalog">\{homeCopy\.heroActions\.browseCatalog\}/);
  assert.match(
    actions,
    /variant="link"[^>]*>\s*\n\s*<OffPathLink href=\{issuesHref\}>\{homeCopy\.heroActions\.seeARealIssue\}/,
  );
  assert.equal((actions.match(/<HomeLink[\s>]/g) ?? []).length, 3);
  assert.equal((actions.match(/<OffPathLink[\s>]/g) ?? []).length, 1);
  assert.doesNotMatch(actions, /<HomeLink[^>]*\btarget=/);
  assert.doesNotMatch(actions, /<HomeLink[^>]*\brel=/);
  const homeLink = readFileSync(join(app, "ui/home/home-link.tsx"), "utf8");
  assert.match(homeLink, /prefetch=\{false\}/);
  assert.match(copy, /getStarted: "Get started"/);
  assert.match(copy, /browseCatalog: "Browse catalog"/);
  assert.match(copy, /seeARealIssue: "See a real issue, end to end"/);
  assert.match(copy, /promptAriaLabel: "Setup prompt"/);
  assert.doesNotMatch(copy, /One-prompt AI setup/);
  assert.match(
    copy,
    /promptCaption: "Name the kits you want, Nest included\. The map knows the order\."/,
  );
  assert.match(lead, /aria-label=\{homeCopy\.hero\.promptAriaLabel\}/);
  assert.doesNotMatch(actions + copy, /Browse components/);
  assert.match(nav, /text: "AI"/);
  assert.match(nav, /text: "UI"/);
  assert.match(nav, /text: "Docs"/);
  assert.match(nav, /text: "Catalog"/);
  assert.doesNotMatch(nav, /text: "Reviews"/);
  assert.doesNotMatch(nav, /text: "Issues"/);
});

test("home below-hero order is same-idea, six-sentences, paste, identities, limits, manifesto, closing, families, secondary (#119)", () => {
  const src = readFileSync(join(app, "ui/home/home-below-hero.tsx"), "utf8");
  const sameIdea = readFileSync(join(app, "ui/home/home-same-idea-section.tsx"), "utf8");
  const sixSentences = readFileSync(join(app, "ui/home/home-six-sentences-section.tsx"), "utf8");
  const paste = readFileSync(join(app, "ui/home/home-paste-section.tsx"), "utf8");
  const limits = readFileSync(join(app, "ui/home/home-limits-section.tsx"), "utf8");
  const manifesto = readFileSync(join(app, "ui/home/home-manifesto-section.tsx"), "utf8");
  const closing = readFileSync(join(app, "ui/home/home-closing-section.tsx"), "utf8");
  const sameIdeaCopy = readFileSync(join(app, "ui/home/i18n/home-same-idea-copy.ts"), "utf8");
  const sixSentencesCopy = readFileSync(join(app, "ui/home/i18n/home-six-sentences-copy.ts"), "utf8");
  const pasteCopy = readFileSync(join(app, "ui/home/i18n/home-paste-copy.ts"), "utf8");
  const limitsCopy = readFileSync(join(app, "ui/home/i18n/home-limits-copy.ts"), "utf8");
  const manifestoCopy = readFileSync(join(app, "ui/home/i18n/home-manifesto-copy.ts"), "utf8");
  const closingCopy = readFileSync(join(app, "ui/home/i18n/home-closing-copy.ts"), "utf8");
  const looksCopy = readFileSync(join(app, "ui/home/home-identity-looks-copy.ts"), "utf8");
  const order = [
    ...src.matchAll(
      /<Home(SameIdea|SixSentences|Paste|Identities|Limits|Manifesto|Closing|ComponentFamilies|Secondary)Section/g,
    ),
  ].map((match) => match[1]);
  assert.deepEqual(order, [
    "SameIdea",
    "SixSentences",
    "Paste",
    "Identities",
    "Limits",
    "Manifesto",
    "Closing",
    "ComponentFamilies",
    "Secondary",
  ]);
  assert.doesNotMatch(src, /HomeAiSetupSection|HomeGetStartedSection|featuredPackage/);
  assert.doesNotMatch(src + limits + manifesto + closing + paste, /@zedtech\/zedkit-ui\/marketing/);
  assert.equal(existsSync(join(app, "ui/home/home-ai-setup-section.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-ai-setup-terminal.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-get-started-section.tsx")), false);
  assert.doesNotMatch(sameIdea, /SetupEntryPrompt|SecretField/);
  assert.match(sameIdeaCopy, /title: "Same idea, two places"/);
  assert.doesNotMatch(sameIdeaCopy, /three places/);
  assert.doesNotMatch(sameIdeaCopy, /\btogether:/);
  assert.match(sameIdeaCopy, /\bui:/);
  assert.match(sameIdeaCopy, /\bai:/);
  assert.match(sameIdea, /COLUMN_IDS = \["ui", "ai"\]/);
  assert.match(sameIdea, /HOME_SAME_IDEA_GRID/);
  const rhythm = readFileSync(join(app, "ui/home/home-rhythm.ts"), "utf8");
  assert.match(
    rhythm,
    /export const HOME_SAME_IDEA_GRID =\s*"trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-pair"/,
  );
  assert.match(
    rhythm,
    /export const HOME_LIMITS_GRID =\s*"trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-trio"/,
  );
  assert.doesNotMatch(sixSentences, /FeatureGrid|SetupEntryPrompt|SecretField/);
  assert.match(sixSentences, /id="six-sentences"/);
  assert.match(sixSentences, /from "@zedtech\/zedkit-ui"/);
  assert.match(
    sixSentencesCopy,
    /Paste one prompt in the agent you already use\. It reads the repo and writes the setup\./,
  );
  assert.match(sixSentencesCopy, /The combined prompt covers AI, UI and Nest \(API\)\./);
  assert.match(sixSentencesCopy, /Install from npm or copy the source\. Same components either way\./);
  assert.match(sixSentencesCopy, /What you see is MIT, React 19, Tailwind 4\./);
  assert.match(sixSentencesCopy, /A look sets type, shape, density and color together\./);
  assert.match(
    sixSentencesCopy,
    /This is packages and a docs site, not a hosted app with accounts\./,
  );
  assert.equal([...sixSentencesCopy.matchAll(/"[^"]+\."/g)].length, 6);
  const tokens = readFileSync(join(app, "app/docs-shell-tokens.css"), "utf8");
  assert.doesNotMatch(tokens, /data-home-install-choice/);
  assert.doesNotMatch(tokens, /#home-page #get-started\[data-slot="section"\]/);
  assert.match(tokens, /\[data-home-manifesto-panel\]/);
  assert.match(paste, /id="paste"/);
  assert.match(paste, /id="ai-setup"/);
  assert.match(paste, /id="get-started"/);
  assert.equal((paste.match(/tabIndex=\{-1\}/g) ?? []).length, 2);
  assert.match(paste, /homePasteCopy\.fullStepsHref/);
  assert.match(paste, /homePasteCopy\.timeline/);
  assert.doesNotMatch(paste, /SetupEntryPrompt|SecretField|data-setup-entry/);
  assert.match(pasteCopy, /Paste one line\. Go to lunch\./);
  assert.match(
    pasteCopy,
    /Name the kits\. The agent follows the map, installs them in order and validates once at the end\./,
  );
  assert.match(pasteCopy, /"2 seconds"/);
  assert.match(pasteCopy, /"15 to 45 min"/);
  assert.match(pasteCopy, /"Same run"/);
  assert.match(pasteCopy, /"Any time after"/);
  assert.doesNotMatch(pasteCopy, /combined prompt|copy field|SecretField/);
  assert.match(pasteCopy, /\/docs\/getting-started#install-or-copy/);
  assert.match(looksCopy, /title: "Every screen, the same product\."/);
  assert.match(looksCopy, /A look sets type, shape, density and color together/);
  assert.doesNotMatch(looksCopy, /Looks like your product/);
  assert.match(limits, /id="limits"/);
  assert.match(limits, /HOME_LIMITS_GRID/);
  assert.doesNotMatch(limits, /FeatureGrid|SetupEntryPrompt|SecretField/);
  assert.match(limitsCopy, /What it doesn't do\./);
  assert.match(limitsCopy, /It won't make your code bug-free\./);
  assert.match(limitsCopy, /It won't test your product in a browser\./);
  assert.match(limitsCopy, /Not every component is finished\./);
  assert.equal((limitsCopy.match(/title: "/g) ?? []).length, 4);
  assert.match(manifesto, /id="manifesto"/);
  assert.match(manifesto, /data-home-manifesto-panel/);
  assert.doesNotMatch(manifesto, /FeatureGrid|SetupEntryPrompt|SecretField|bg-primary/);
  assert.match(
    manifestoCopy,
    /If nobody else can pick up what was built, that isn't expertise\. It's lock-in\./,
  );
  assert.match(manifestoCopy, /From the Zed Tech manifesto/);
  assert.doesNotMatch(manifestoCopy, /Read the manifesto/);
  assert.match(closing, /id="closing"/);
  assert.match(closing, /homeClosingCopy\.actionHref/);
  assert.doesNotMatch(closing, /SetupEntryPrompt|SecretField|data-setup-entry/);
  assert.match(closingCopy, /Next time it says done, it will be\./);
  assert.match(closingCopy, /And it will look like the rest of your product\./);
  assert.match(closingCopy, /action: "Setup"/);
  assert.match(closingCopy, /actionHref: "#ai-setup"/);
});

test("drawer demo save closes and toasts", () => {
  const src = readFileSync(join(app, "components/demos/drawer-demo.tsx"), "utf8");
  assert.match(src, /DrawerClose asChild/);
  assert.match(src, /onClick=\{\(\) => toast\(drawerCopy\.demo\.savedToast\)\}/);
  const copy = readFileSync(join(app, "components/demos/i18n/drawer-copy.ts"), "utf8");
  assert.match(copy, /savedToast: "Saved"/);
  assert.match(src, /open=\{open\} onOpenChange=\{setOpen\}/);
});

test("admin dashboard guide demo wires save and delete to state", () => {
  const src = readFileSync(join(app, "components/demos/admin-dashboard-guide-demo.tsx"), "utf8");
  assert.match(src, /useState<ItemRow\[\]>/);
  assert.match(src, /setRows\(\(current\) => current\.filter/);
  assert.doesNotMatch(src, /h-96 min-h-0 overflow-hidden/);
});

test("docs phone chrome keeps search; home chrome does not", () => {
  const header = readFileSync(join(app, "ui/mobile-header.tsx"), "utf8");
  const siteHeaders = readFileSync(join(app, "ui/site-headers.tsx"), "utf8");
  const actions = readFileSync(join(app, "ui/home-header-actions.tsx"), "utf8");
  const trigger = readFileSync(join(app, "ui/mobile-search-trigger.tsx"), "utf8");
  assert.match(header, /MobileSearchTrigger/);
  assert.match(header, /isHomePath/);
  assert.doesNotMatch(header, /SearchPill/);
  assert.doesNotMatch(header, /DocsIdentityPicker/);
  assert.doesNotMatch(header, /SITE_GUIDE_LINKS|siteChromeCopy\.nav\.guides/);
  assert.match(siteHeaders, /isHomePath/);
  assert.match(actions, /#get-started/);
  assert.match(actions, /data-site-action/);
  assert.match(actions, /SITE_GITHUB_URL/);
  assert.match(actions, /OffPathLink/);
  assert.doesNotMatch(actions, /<GithubIcon|aria-label=\{siteChromeCopy\.nav\.github\}/);
  assert.doesNotMatch(actions, /target="_blank"/);
  assert.doesNotMatch(trigger, /fumadocs-core\/search\/client/);
});
