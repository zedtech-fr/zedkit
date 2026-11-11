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

test("home hero lead is the joint title, one Setup entry, no kit tabs (#111)", () => {
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
  assert.match(lead, /AI_SETUP_MINI_PROMPT/);
  assert.doesNotMatch(lead, /MAP_SETUP_MINI_PROMPT/);
  assert.doesNotMatch(lead + actions, /\bTabs\b/);
  assert.doesNotMatch(lead + actions, /SetupEntryPrompt/);
  assert.doesNotMatch(lead + actions, /\/issues\//);
  assert.doesNotMatch(lead + actions, /target="_blank"/);
  assert.match(
    lead,
    /<SecretField[\s\S]*<HomeHeroLeadActions \/>[\s\S]*homeCopy\.hero\.facts/,
  );
  assert.match(actions, /from "@\/ui\/home\/home-link"/);
  // Primary Setup, then Get started outline, then the quiet catalog link. Hashes land on the paste band (#119).
  assert.match(actions, /<Button asChild>\s*\n\s*<HomeLink href="#ai-setup">\{homeCopy\.heroActions\.setup\}/);
  assert.match(
    actions,
    /variant="outline"[^>]*>\s*\n\s*<HomeLink href="#get-started">\{homeCopy\.heroActions\.getStarted\}/,
  );
  assert.match(actions, /variant="link"[^>]*>\s*\n\s*<HomeLink href="\/catalog">\{homeCopy\.heroActions\.browseCatalog\}/);
  assert.equal((actions.match(/<HomeLink[\s>]/g) ?? []).length, 3);
  assert.doesNotMatch(actions, /\btarget=/);
  assert.doesNotMatch(actions, /\brel=/);
  const homeLink = readFileSync(join(app, "ui/home/home-link.tsx"), "utf8");
  assert.match(homeLink, /prefetch=\{false\}/);
  assert.match(copy, /getStarted: "Get started"/);
  assert.match(copy, /browseCatalog: "Browse catalog"/);
  assert.match(copy, /promptAriaLabel: "One-prompt AI setup"/);
  assert.match(lead, /aria-label=\{homeCopy\.hero\.promptAriaLabel\}/);
  assert.doesNotMatch(actions + copy, /Browse components/);
  assert.match(nav, /text: "AI"/);
  assert.match(nav, /text: "UI"/);
  assert.match(nav, /text: "Docs"/);
  assert.match(nav, /text: "Catalog"/);
  assert.doesNotMatch(nav, /text: "Reviews"/);
  assert.doesNotMatch(nav, /text: "Issues"/);
});

test("home below-hero order is same-idea, paste, identities, families, secondary (#119)", () => {
  const src = readFileSync(join(app, "ui/home/home-below-hero.tsx"), "utf8");
  const sameIdea = readFileSync(join(app, "ui/home/home-same-idea-section.tsx"), "utf8");
  const paste = readFileSync(join(app, "ui/home/home-paste-section.tsx"), "utf8");
  const sameIdeaCopy = readFileSync(join(app, "ui/home/i18n/home-same-idea-copy.ts"), "utf8");
  const pasteCopy = readFileSync(join(app, "ui/home/i18n/home-paste-copy.ts"), "utf8");
  const order = [...src.matchAll(/<Home(SameIdea|Paste|Identities|ComponentFamilies|Secondary)Section/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(order, ["SameIdea", "Paste", "Identities", "ComponentFamilies", "Secondary"]);
  assert.doesNotMatch(src, /HomeAiSetupSection|HomeGetStartedSection|featuredPackage/);
  assert.equal(existsSync(join(app, "ui/home/home-ai-setup-section.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-ai-setup-terminal.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-get-started-section.tsx")), false);
  assert.doesNotMatch(sameIdea, /SetupEntryPrompt|SecretField/);
  assert.match(sameIdeaCopy, /title: "Same idea, three places"/);
  assert.match(sameIdeaCopy, /Nest \(API\)/);
  assert.match(sameIdeaCopy, /One map prompt covers/);
  assert.match(sameIdeaCopy, /\bai:/);
  assert.match(sameIdeaCopy, /\bui:/);
  assert.match(sameIdeaCopy, /\btogether:/);
  assert.match(sameIdea, /HOME_SAME_IDEA_GRID/);
  const rhythm = readFileSync(join(app, "ui/home/home-rhythm.ts"), "utf8");
  assert.match(rhythm, /export const HOME_SAME_IDEA_GRID/);
  const tokens = readFileSync(join(app, "app/docs-shell-tokens.css"), "utf8");
  assert.doesNotMatch(tokens, /data-home-install-choice/);
  assert.doesNotMatch(tokens, /#home-page #get-started\[data-slot="section"\]/);
  assert.match(paste, /id="paste"/);
  assert.match(paste, /id="ai-setup"/);
  assert.match(paste, /id="get-started"/);
  assert.equal((paste.match(/tabIndex=\{-1\}/g) ?? []).length, 2);
  assert.match(paste, /homePasteCopy\.fullStepsHref/);
  assert.match(pasteCopy, /Paste one line\. Go to lunch\./);
  assert.match(pasteCopy, /Nest \(API\)/);
  assert.match(pasteCopy, /\/docs\/getting-started#install-or-copy/);
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

test("mobile header keeps search in the phone chrome", () => {
  const header = readFileSync(join(app, "ui/mobile-header.tsx"), "utf8");
  const trigger = readFileSync(join(app, "ui/mobile-search-trigger.tsx"), "utf8");
  assert.match(header, /MobileSearchTrigger/);
  assert.doesNotMatch(header, /SearchPill/);
  assert.doesNotMatch(header, /DocsIdentityPicker/);
  assert.doesNotMatch(trigger, /fumadocs-core\/search\/client/);
});
