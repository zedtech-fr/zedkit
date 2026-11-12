import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(app, "../..");

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

test("home hero first screen is the mockup lead and glass illustration, not the live window (#118)", () => {
  const hero = readFileSync(join(app, "ui/home/home-hero.tsx"), "utf8");
  const lead = readFileSync(join(app, "ui/home/home-hero-lead.tsx"), "utf8");
  const illustration = readFileSync(join(app, "ui/home/home-hero-illustration.tsx"), "utf8");
  const copy = readFileSync(join(app, "ui/home/i18n/home-hero-copy.ts"), "utf8");
  const nav = readFileSync(join(app, "lib/site-nav-data.ts"), "utf8");
  const firstScreen = hero + lead + illustration;
  // #118 supersedes #111/#114: kit tabs and the third title clause are the first screen, not one Setup row.
  assert.equal(existsSync(join(app, "ui/home/home-hero-lead-actions.tsx")), false);
  assert.doesNotMatch(firstScreen, /HomeHeroPreview|HomeHeroApp|HomeHeroSatellites|AgentConsole|IdentityLookForm/);
  assert.doesNotMatch(firstScreen, /\bid=["']demo["']/);
  assert.match(hero, /HeroShapes/);
  assert.match(hero, /publicIssueHref/);
  assert.match(lead, /\bTabs\b/);
  assert.match(lead, /TabsList/);
  assert.match(lead, /TabsTrigger/);
  assert.match(lead, /defaultValue="combined"|value=\{kit\}/);
  assert.match(copy, /title: "Code that's checked\. Screens that match\."/);
  assert.match(copy, /titleClause: "From the agent you already use\."/);
  assert.match(copy, /titleCategory: "Open source · MIT · by Zed Tech"/);
  assert.match(copy, /combined: "AI \+ UI"/);
  assert.match(copy, /emptyStateTitle: "Add an empty state to the tasks list"/);
  assert.match(copy, /Plan/);
  assert.match(copy, /Build/);
  assert.match(copy, /Check/);
  assert.match(copy, /Fix/);
  assert.match(copy, /Done/);
  assert.match(lead, /typeRole="lead"/);
  assert.match(lead, /data-home-hero-sub/);
  assert.match(lead, /text-muted-foreground/);
  assert.match(lead, /homeCopy\.hero\.titleClause/);
  assert.match(lead, /MAP_SETUP_MINI_PROMPT/);
  assert.match(lead, /AI_SETUP_MINI_PROMPT/);
  assert.match(lead, /UI_SETUP_MINI_PROMPT/);
  assert.match(lead, /\bmultiline\b/);
  assert.match(lead, /data-home-hero-prompt/);
  assert.doesNotMatch(lead, /SetupEntryPrompt/);
  assert.doesNotMatch(lead, /\/issues\/108/);
  assert.doesNotMatch(firstScreen, /data-site-action/);
  assert.doesNotMatch(lead, /heroActions\.setup|heroActions\.getStarted|heroActions\.browseCatalog|#ai-setup|#get-started|\/catalog/);
  assert.match(lead, /OffPathLink/);
  assert.match(lead, /heroActions\.seeARealIssue/);
  assert.equal((lead.match(/<HomeLink[\s>]/g) ?? []).length, 0);
  assert.equal((lead.match(/<OffPathLink[\s>]/g) ?? []).length, 1);
  assert.match(copy, /seeARealIssue: "See a real issue, end to end"/);
  assert.doesNotMatch(copy, /seeARealIssue: ".*→/);
  assert.match(copy, /promptAriaLabel: "Setup prompt"/);
  assert.match(
    copy,
    /promptCaption: "Name the kits you want, Nest included\. The map knows the order\."/,
  );
  assert.match(lead, /aria-label=\{homeCopy\.hero\.promptAriaLabel\}/);
  assert.doesNotMatch(copy, /facts:/);
  assert.doesNotMatch(illustration, /IdentityLookForm|AgentConsole|ThemeScope/);
  assert.match(illustration, /data-hero-run-stage/);
  assert.match(illustration, /useMotionOk/);
  assert.match(illustration, /role="group"/);
  assert.match(illustration, /aria-pressed=\{paused\}/);
  assert.match(copy, /pauseMotion: "Pause illustration motion"/);
  assert.match(copy, /playMotion: "Play illustration motion"/);
  assert.doesNotMatch(illustration, /<span className="inline-flex flex-wrap items-center gap-icon">/);
  assert.match(nav, /text: "AI"/);
  assert.match(nav, /text: "UI"/);
  assert.match(nav, /text: "Docs"/);
  assert.match(nav, /text: "Catalog"/);
  assert.doesNotMatch(nav, /text: "Reviews"/);
  assert.doesNotMatch(nav, /text: "Issues"/);
});

test("home below-hero order is same-idea, six-sentences, paste, identities, limits, manifesto, closing (#210)", () => {
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
  const dockCopy = readFileSync(join(app, "components/i18n/identity-dock-copy.ts"), "utf8");
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
  ]);
  assert.doesNotMatch(src, /HomeYoursScene|HomeComponentFamiliesSection|HomeSecondarySection/);
  assert.doesNotMatch(src, /entryPoints|HomeEntryPoint/);
  assert.equal(existsSync(join(app, "ui/home/home-yours-scene.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-component-families-section.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-secondary-section.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/i18n/home-yours-copy.ts")), false);
  assert.equal(existsSync(join(app, "ui/home/i18n/home-component-families-copy.ts")), false);
  assert.equal(existsSync(join(app, "ui/home/i18n/home-marketing-sections-copy.ts")), false);
  assert.match(dockCopy, /pillLabel: "And yours\?"/);
  assert.doesNotMatch(dockCopy, /homeYoursCopy/);
  assert.doesNotMatch(src, /HomeAiSetupSection|HomeGetStartedSection|featuredPackage/);
  assert.doesNotMatch(src + limits + manifesto + closing + paste, /@zedtech\/zedkit-ui\/marketing/);
  assert.equal(existsSync(join(app, "ui/home/home-ai-setup-section.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-ai-setup-terminal.tsx")), false);
  assert.equal(existsSync(join(app, "ui/home/home-get-started-section.tsx")), false);
  assert.doesNotMatch(sameIdea, /SetupEntryPrompt|SecretField|FeatureGrid|OffPathLink|@zedtech\/zedkit-ui\/marketing/);
  assert.match(sameIdeaCopy, /title: "Same idea, two places\."/);
  assert.match(
    sameIdeaCopy,
    /description: "Tell the agent once what a good team already knows, and keep it in the repo\."/,
  );
  assert.match(sameIdeaCopy, /title: "zedkit AI"/);
  assert.match(sameIdeaCopy, /title: "zedkit UI"/);
  assert.match(sameIdeaCopy, /title: "Together"/);
  assert.match(sameIdeaCopy, /href: "\/docs\/ai\/setup"/);
  assert.match(sameIdeaCopy, /href: "\/catalog"/);
  assert.match(sameIdeaCopy, /href: "\/map\.md"/);
  assert.match(sameIdeaCopy, /heading: "What lands in your repo"/);
  assert.match(sameIdeaCopy, /link: "AI setup guide"/);
  assert.match(sameIdeaCopy, /link: "Browse the catalog"/);
  assert.match(sameIdeaCopy, /link: "Read map\.md"/);
  assert.match(sameIdea, /CARD_IDS = \["ai", "ui", "together"\]/);
  assert.match(sameIdea, /HOME_SAME_IDEA_CARDS_GRID/);
  assert.doesNotMatch(sameIdea, /HOME_SAME_IDEA_GRID/);
  assert.doesNotMatch(sameIdea, /px-badge-inline/);
  assert.match(sameIdea, /WINDOW_CHIP =\s*"rounded-md bg-primary-foreground\/20 px-code-inline/);
  assert.match(sameIdea, /pointer-events-none text-primary-foreground/);
  assert.match(sameIdea, /<Heading level=\{3\} typeRole="body">\s*\{lands\.heading\}/);
  assert.match(sameIdea, /data-home-same-idea-lands/);
  assert.match(sameIdea, /data-home-same-idea-window/);
  assert.match(sameIdea, /aria-hidden/);
  assert.match(sameIdea, /HomeLink/);
  assert.match(src, /HomeSameIdeaSection componentCount=\{uiGalleryStats\.components\}/);
  const page = readFileSync(join(app, "app/(site)/page.tsx"), "utf8");
  assert.match(page, /import \{ uiGalleryStats \} from ["']@\/content\/gallery["']/);
  const rhythm = readFileSync(join(app, "ui/home/home-rhythm.ts"), "utf8");
  assert.doesNotMatch(rhythm, /HOME_SAME_IDEA_GRID/);
  assert.match(
    rhythm,
    /export const HOME_SAME_IDEA_CARDS_GRID =\s*"trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-trio"/,
  );
  assert.match(
    rhythm,
    /export const HOME_LIMITS_GRID =\s*"trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-trio"/,
  );
  assert.doesNotMatch(sixSentences, /FeatureGrid|SetupEntryPrompt|SecretField/);
  assert.doesNotMatch(sixSentences, /@zedtech\/zedkit-ui\/marketing/);
  assert.doesNotMatch(sixSentences, /col-span-2|grid-cols-4/);
  assert.match(sixSentences, /id="six-sentences"/);
  assert.match(sixSentences, /from "@zedtech\/zedkit-ui"/);
  assert.match(sixSentences, /tone="muted"/);
  assert.match(sixSentences, /HOME_SIX_SENTENCES_GRID/);
  assert.match(sixSentences, /<Badge/);
  assert.match(sixSentences, /<blockquote/);
  assert.match(sixSentences, /lg:span-rest/);
  assert.match(sixSentences, /data-home-six-sentences-card=\{featured \? "featured" : "plain"\}/);
  assert.match(sixSentences, /id === "quality" \|\| id === "consistency"/);
  assert.match(sixSentences, /card\.replyBody\(componentCount\)/);
  assert.match(src, /HomeSixSentencesSection componentCount=\{uiGalleryStats\.components\}/);
  assert.match(
    rhythm,
    /export const HOME_SIX_SENTENCES_GRID =\s*"trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-quad"/,
  );
  assert.doesNotMatch(sixSentencesCopy, /What the kit is/);
  assert.match(sixSentencesCopy, /title: "Six sentences you stop hearing\."/);
  assert.match(sixSentencesCopy, /description: "Three about how the agent works\. Three about what it draws\."/);
  assert.match(sixSentencesCopy, /id: "quality"/);
  assert.match(sixSentencesCopy, /id: "time"/);
  assert.match(sixSentencesCopy, /id: "fewer-bugs"/);
  assert.match(sixSentencesCopy, /id: "brand"/);
  assert.match(sixSentencesCopy, /id: "finish"/);
  assert.match(sixSentencesCopy, /id: "consistency"/);
  assert.match(sixSentencesCopy, /label: "Quality"/);
  assert.match(sixSentencesCopy, /label: "Time"/);
  assert.match(sixSentencesCopy, /label: "Fewer bugs"/);
  assert.match(sixSentencesCopy, /label: "Brand"/);
  assert.match(sixSentencesCopy, /label: "Finish"/);
  assert.match(sixSentencesCopy, /label: "Consistency"/);
  assert.match(sixSentencesCopy, /“Looks good to me\.”/);
  assert.match(sixSentencesCopy, /“Let me first explore the codebase\.”/);
  assert.match(sixSentencesCopy, /“Done!”/);
  assert.match(sixSentencesCopy, /“I went with a clean, modern blue\.”/);
  assert.match(sixSentencesCopy, /“The happy path works\.”/);
  assert.match(sixSentencesCopy, /“I created a new Button component\.”/);
  assert.match(sixSentencesCopy, /Said the agent that wrote it\./);
  assert.match(sixSentencesCopy, /The one who writes never checks\./);
  assert.match(sixSentencesCopy, /It learns your repo once\./);
  assert.match(sixSentencesCopy, /Done has a definition\./);
  assert.match(sixSentencesCopy, /A look is one attribute\./);
  assert.match(sixSentencesCopy, /The boring states already exist\./);
  assert.match(sixSentencesCopy, /One way to do each thing\./);
  assert.match(
    sixSentencesCopy,
    /replyBody: \(componentCount: number\) =>\s*`\$\{componentCount\} components that already agree with each other\. The agent reaches for them instead of inventing\.`/,
  );
  assert.doesNotMatch(sixSentencesCopy, /\d+ components that already agree/);
  assert.match(sameIdeaCopy, /stack: "React 19 and Tailwind CSS 4, from npm or as source"/);
  assert.match(sameIdeaCopy, /mit: "MIT"/);
  assert.doesNotMatch(sixSentencesCopy, /What you see is MIT/);
  const heroCss = readFileSync(join(app, "app/home-hero.css"), "utf8");
  const signatureCss = readFileSync(join(app, "app/docs-signature.css"), "utf8");
  assert.match(heroCss, /#home-page \[data-home-hero-lead\] h1/);
  assert.match(heroCss, /max-width:\s*48rem/);
  assert.match(heroCss, /#home-page \[data-home-hero-sub\]/);
  assert.match(heroCss, /max-width:\s*32\.5rem/);
  assert.match(heroCss, /#home-page \[data-home-hero-band\]/);
  assert.match(heroCss, /padding-top:\s*2\.5rem/);
  assert.doesNotMatch(signatureCss, /\[data-home-hero-lead\] h1/);
  const tokens = readFileSync(join(app, "app/docs-shell-tokens.css"), "utf8");
  assert.doesNotMatch(tokens, /\[data-home-hero-band\]/);
  assert.match(tokens, /\[data-home-six-sentences/);
  assert.match(tokens, /\[data-home-six-sentences-card="featured"\]/);
  assert.match(tokens, /\[data-home-six-sentences-card="plain"\] \[data-home-six-sentences-kit="ai"\]/);
  assert.match(tokens, /\[data-home-six-sentences-card="plain"\] \[data-home-six-sentences-kit="ui"\]/);
  assert.doesNotMatch(tokens, /#1B1764|#2B23C7|#4B3FD9|#3B1F8F|#5B34B5|#7C5CE6/);
  assert.doesNotMatch(tokens, /data-home-install-choice/);
  assert.doesNotMatch(tokens, /#home-page #get-started\[data-slot="section"\]/);
  assert.match(tokens, /#home-page #manifesto\[data-slot="section"\]/);
  assert.match(
    tokens,
    /#home-page #manifesto\[data-slot="section"\] \{[^}]*background-color:\s*hsl\(var\(--primary\)\)/,
  );
  assert.match(
    tokens,
    /#home-page #manifesto\[data-slot="section"\] \{[^}]*--foreground:\s*var\(--primary-foreground\)/,
  );
  assert.match(
    tokens,
    /#home-page #manifesto\[data-slot="section"\] \{[^}]*--ring:\s*var\(--primary-foreground\)/,
  );
  assert.doesNotMatch(tokens, /linear-gradient/);
  const manifestoCss = tokens.match(/#home-page #manifesto\[data-slot="section"\] \{[^}]+\}/);
  assert.ok(manifestoCss, "manifesto section fill rule");
  assert.doesNotMatch(manifestoCss[0], /#[0-9A-Fa-f]{3,8}/);
  assert.doesNotMatch(manifestoCss[0], /border-radius/);
  assert.doesNotMatch(manifestoCss[0], /padding:/);
  assert.match(paste, /id="paste"/);
  assert.match(paste, /data-home-paste=/);
  assert.match(paste, /id="ai-setup"/);
  assert.match(paste, /id="get-started"/);
  assert.equal((paste.match(/tabIndex=\{-1\}/g) ?? []).length, 2);
  assert.doesNotMatch(paste, /fullStepsHref|landsHeading|nestLands|data-home-full-steps/);
  assert.doesNotMatch(paste, /Button|HomeLink|DocsActionLabel/);
  assert.match(paste, /spacing="lg"/);
  assert.match(paste, /gap="blocks"/);
  assert.match(paste, /surface-pad-lg/);
  assert.doesNotMatch(paste, /surface-pad-md/);
  assert.match(paste, /homePasteCopy\.timeline/);
  assert.match(paste, /homePasteCopy\.lands/);
  assert.match(paste, /homePasteCopy\.skillsAgents/);
  assert.match(paste, /homeSameIdeaCopy\.kitCounts/);
  assert.match(paste, /kitCounts\.skills/);
  assert.match(paste, /kitCounts\.agents/);
  assert.match(paste, /Object\.keys\(homePasteCopy\.lands\)/);
  assert.doesNotMatch(paste, /LANDS_IDS = \["ai", "ui"\]/);
  assert.doesNotMatch(paste, /role="list"/);
  assert.match(paste, /data-home-paste-lands/);
  assert.match(paste, /HOME_PASTE_LANDS_GRID/);
  assert.match(paste, /<Badge /);
  assert.match(paste, /bg-primary-foreground/);
  assert.match(paste, /text-primary/);
  assert.match(paste, /text-accent/);
  assert.doesNotMatch(paste, /<Badge>/);
  assert.doesNotMatch(paste, /variant="muted" className="font-mono text-dense"/);
  assert.doesNotMatch(paste, /SetupEntryPrompt|SecretField|data-setup-entry/);
  assert.match(
    rhythm,
    /export const HOME_PASTE_LANDS_GRID =\s*"trim-margin grid content-shrink list-none flush lg:grid-pair"/,
  );
  assert.match(tokens, /#home-page #paste\[data-slot="section"\]/);
  assert.match(tokens, /background-color:\s*hsl\(var\(--zk-site-action\)\)/);
  assert.match(tokens, /#home-page #paste\[data-slot="section"\] \{[^}]*--muted:\s*var\(--zk-site-action-hover\)/);
  assert.match(tokens, /#home-page #paste\[data-slot="section"\] \{[^}]*--secondary:\s*var\(--zk-site-action-hover\)/);
  assert.match(
    tokens,
    /#home-page #paste\[data-slot="section"\] \{[^}]*--secondary-foreground:\s*var\(--zk-site-action-foreground\)/,
  );
  assert.match(tokens, /\[data-home-same-idea-lands\]/);
  assert.match(tokens, /#home-page \[data-home-same-idea-lands\] \{[^}]*--muted:\s*var\(--zk-site-action-hover\)/);
  assert.match(tokens, /#home-page \[data-home-same-idea-lands\] \{[^}]*--secondary:\s*var\(--zk-site-action-hover\)/);
  assert.match(
    tokens,
    /#home-page \[data-home-same-idea-lands\] \{[^}]*background-color:\s*hsl\(var\(--zk-site-action\)\)/,
  );
  assert.match(pasteCopy, /Paste one line\. Go to lunch\./);
  assert.match(
    pasteCopy,
    /Name the kits\. The agent follows the map, installs them in order and validates once at the end\./,
  );
  assert.match(pasteCopy, /"2 seconds"/);
  assert.match(pasteCopy, /The agent has the kits you named and starts the map\./);
  assert.doesNotMatch(pasteCopy, /land in your repo/);
  assert.match(pasteCopy, /"15 to 45 min"/);
  assert.match(pasteCopy, /"Same run"/);
  assert.match(pasteCopy, /"Any time after"/);
  assert.doesNotMatch(pasteCopy, /landsHeading|nestLands|fullSteps/);
  assert.doesNotMatch(pasteCopy, /What lands|Nest \(API\)|Full install steps/);
  assert.match(pasteCopy, /lands: \{\s*ai:/);
  assert.doesNotMatch(pasteCopy, /lands: \{\s*ui:/);
  assert.match(pasteCopy, /when: "after lunch"/);
  assert.match(pasteCopy, /when: "same run"/);
  assert.doesNotMatch(pasteCopy, /during the run/);
  assert.match(pasteCopy, /AGENTS\.md/);
  assert.match(pasteCopy, /\.agents\/product\.md/);
  assert.match(pasteCopy, /what the product does/);
  assert.match(pasteCopy, /\.agents\/domain\/tasks\.md/);
  assert.match(pasteCopy, /its rules/);
  assert.match(pasteCopy, /\.agents\/skills\//);
  assert.match(pasteCopy, /skillsAgents: \(skills: number, agents: number\) =>/);
  assert.match(pasteCopy, /\$\{skills\} · agents\/ \$\{agents\}/);
  assert.match(pasteCopy, /package\.json/);
  assert.match(pasteCopy, /@zedtech\/zedkit-ui/);
  assert.match(pasteCopy, /src\/app\/globals\.css/);
  assert.match(pasteCopy, /kit styles/);
  assert.match(pasteCopy, /src\/app\/layout\.tsx/);
  assert.match(pasteCopy, /data-identity="glass"/);
  assert.match(pasteCopy, /\.agents\/design\.md/);
  assert.match(pasteCopy, /which components to use/);
  assert.doesNotMatch(pasteCopy, /combined prompt|copy field|SecretField/);
  assert.doesNotMatch(pasteCopy, /30 skills|13 agents|68 components|6 looks/);
  assert.doesNotMatch(pasteCopy, /\/docs\/getting-started#install-or-copy/);
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
  assert.match(manifesto, /aria-labelledby="manifesto-heading"/);
  assert.match(manifesto, /data-home-manifesto=/);
  assert.doesNotMatch(manifesto, /data-home-manifesto-panel/);
  assert.match(manifesto, /className="sr-only"/);
  assert.match(manifesto, /<blockquote className="trim-margin not-italic" aria-describedby="manifesto-attribution">/);
  assert.match(manifesto, /id="manifesto-attribution"/);
  assert.match(manifesto, /from "@\/ui\/off-path-link"/);
  assert.match(manifesto, /from "@\/lib\/site-links\.mjs"/);
  assert.match(manifesto, /href=\{SITE_COMPANY_URL\}/);
  assert.match(manifesto, /\{homeManifestoCopy\.readLink\}/);
  assert.doesNotMatch(manifesto, /<OffPathLink[^>]*\btarget=/);
  assert.doesNotMatch(manifesto, /<OffPathLink[^>]*\brel=/);
  assert.doesNotMatch(manifesto, /FeatureGrid|SetupEntryPrompt|SecretField|bg-primary/);
  assert.match(
    manifestoCopy,
    /\\u201cIf nobody else can pick up what was built, that isn't expertise\. It's lock-in\.\\u201d/,
  );
  assert.match(manifestoCopy, /From the Zed Tech manifesto/);
  assert.match(manifestoCopy, /sectionLabel: "Manifesto"/);
  assert.match(manifestoCopy, /readLink: "Read the manifesto"/);
  assert.doesNotMatch(manifestoCopy, /→/);
  assert.doesNotMatch(manifestoCopy, /https:\/\/zedtech\.fr/);
  assert.match(closing, /id="closing"/);
  assert.match(closing, /aria-labelledby="closing-heading"/);
  assert.match(closing, /data-home-closing=/);
  assert.match(closing, /SecretField/);
  assert.match(closing, /\bmultiline\b/);
  assert.match(closing, /w-full text-left/);
  assert.match(closing, /MAP_SETUP_MINI_PROMPT/);
  assert.match(closing, /aria-label=\{homeClosingCopy\.promptAriaLabel\}/);
  assert.match(closing, /copyLabel=\{homeClosingCopy\.promptCopyLabel\}/);
  assert.doesNotMatch(closing, /SetupEntryPrompt|data-setup-entry|homeClosingCopy\.actionHref/);
  assert.match(closingCopy, /Next time it says done, it will be\./);
  assert.match(closingCopy, /And it will look like the rest of your product\./);
  assert.match(closingCopy, /promptAriaLabel: "Closing setup prompt"/);
  assert.doesNotMatch(closingCopy, /promptAriaLabel: "Setup prompt"/);
  assert.match(closingCopy, /promptCopyLabel: "Copy closing prompt"/);
  assert.doesNotMatch(closingCopy, /promptCopyLabel: "Copy prompt"/);
  const smoke = readFileSync(join(app, "tests/home.spec.ts"), "utf8");
  assert.match(smoke, /getByRole\("textbox", \{ name: "Setup prompt", exact: true \}\)/);
  assert.match(smoke, /getByRole\("button", \{ name: "Copy prompt", exact: true \}\)/);
  assert.match(smoke, /getByRole\("button", \{ name: "Copy closing prompt", exact: true \}\)/);
  assert.doesNotMatch(closingCopy, /action: "Setup"/);
  assert.doesNotMatch(closingCopy, /actionHref: "#ai-setup"/);
});

test("same-idea lands counts match kit dirs, gallery components, and six identity sheets (#209)", () => {
  const skillsDir = join(root, "packages/ai/kit/skills");
  const agentsDir = join(root, "packages/ai/kit/agents");
  const identitiesDir = join(root, "packages/ui/src/identities");
  const skills = readdirSync(skillsDir, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && existsSync(join(skillsDir, entry.name, "SKILL.md")),
  ).length;
  const agents = readdirSync(agentsDir).filter((name) => name.endsWith(".md")).length;
  const looks = 1 + readdirSync(identitiesDir).filter((name) => name.endsWith(".css")).length;
  const gallery = readFileSync(join(app, "content/gallery.ts"), "utf8");
  const componentsMatch = gallery.match(/uiGalleryStats[^=]*=\s*\{[^}]*"components":\s*(\d+)/);
  const components = Number(componentsMatch?.[1]);
  const sameIdeaCopy = readFileSync(join(app, "ui/home/i18n/home-same-idea-copy.ts"), "utf8");
  const sameIdea = readFileSync(join(app, "ui/home/home-same-idea-section.tsx"), "utf8");
  const paste = readFileSync(join(app, "ui/home/home-paste-section.tsx"), "utf8");
  const pasteCopy = readFileSync(join(app, "ui/home/i18n/home-paste-copy.ts"), "utf8");
  assert.equal(looks, 6);
  assert.match(sameIdeaCopy, new RegExp(`skills:\\s*${skills}`));
  assert.match(sameIdeaCopy, new RegExp(`agents:\\s*${agents}`));
  assert.match(sameIdeaCopy, new RegExp(`looks:\\s*${looks}`));
  assert.match(sameIdeaCopy, /Six looks, or one made for your brand/);
  assert.equal(Number.isInteger(components) && components > 0, true);
  assert.match(sameIdea, /componentCount/);
  assert.doesNotMatch(sameIdeaCopy, /30 skills|13 agents|68 components/);
  assert.match(paste, /homeSameIdeaCopy\.kitCounts/);
  assert.match(paste, /homePasteCopy\.skillsAgents/);
  assert.doesNotMatch(pasteCopy, new RegExp(`${skills} · agents/ ${agents}`));
  assert.doesNotMatch(pasteCopy, /30 · agents\/ 13/);
});

test("home looks band is specimen | look-name pills, not a Section header or palette-dot tabs (#119)", () => {
  const section = readFileSync(join(app, "ui/home/home-identities-section.tsx"), "utf8");
  const looks = readFileSync(join(app, "ui/home/home-identity-looks.tsx"), "utf8");
  const tabs = readFileSync(join(app, "ui/home/home-identity-looks-tabs.tsx"), "utf8");
  const copy = readFileSync(join(app, "ui/home/home-identity-looks-copy.ts"), "utf8");
  const facts = readFileSync(join(app, "ui/home/home-identity-facts.ts"), "utf8");
  const rhythm = readFileSync(join(app, "ui/home/home-rhythm.ts"), "utf8");
  assert.doesNotMatch(section, /\btitle=\{/);
  assert.doesNotMatch(section, /\bdescription=\{/);
  assert.doesNotMatch(section, /HomeYoursScene|#your-identity|data-home-yours/);
  assert.match(looks, /HOME_LOOKS_GRID/);
  assert.match(looks, /<Heading/);
  assert.match(looks, /lg:col-start-first/);
  assert.match(looks, /lg:col-start-next/);
  assert.match(
    rhythm,
    /export const HOME_LOOKS_GRID =\s*"grid content-shrink gap-stack-lg lg:grid-pair"/,
  );
  assert.match(looks, /data-identity=/);
  assert.doesNotMatch(looks, /liveNote/);
  assert.doesNotMatch(looks + tabs + section, /SetupEntryPrompt|SecretField/);
  assert.doesNotMatch(tabs, /HomeIdentityPaletteDots|data-palette-dots|ScrollGallery/);
  assert.doesNotMatch(tabs, /homeIdentityLooksCopy\.products/);
  assert.match(tabs, /HOME_IDENTITY_FACTS\[id\]\.label/);
  assert.doesNotMatch(tabs, /[Gg]lass/);
  assert.match(facts, /IDENTITY_IDS = \["glass", "mist", "press", "maison"\]/);
  assert.match(copy, /title: "Every screen, the same product\."/);
  assert.match(copy, /tabsAriaLabel: "Looks"/);
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
  const compact = readFileSync(join(app, "app/site-compact.css"), "utf8");
  const layout = readFileSync(join(app, "ui/site-layout.tsx"), "utf8");
  assert.match(header, /siteHeaderChrome/);
  assert.match(header, /id="nd-mobile-nav"/);
  assert.match(header, /aria-label=\{siteChromeCopy\.nav\.siteNavigation\}/);
  assert.match(header, /flex-wrap/);
  assert.match(header, /min-h-phone-bar/);
  assert.match(header, /px-page-gutter/);
  assert.match(header, /ms-auto/);
  assert.match(header, /SiteFullSearchTrigger/);
  assert.match(header, /HomeGitHubLink/);
  assert.doesNotMatch(header, /chrome\.github/);
  assert.match(header, /HomeGetStartedAction/);
  assert.match(header, /siteChromeCopy\.nav\.openNavigation/);
  assert.match(header, /data-header-actions/);
  assert.match(header, /gap-icon/);
  assert.match(header, /<ul className=/);
  assert.doesNotMatch(header, /MobileSearchTrigger/);
  assert.doesNotMatch(header, /HomeMenuButton|SiteNavDrawer|ThemeButton|KitVersionLabel/);
  assert.doesNotMatch(header, /SearchPill/);
  assert.doesNotMatch(header, /DocsIdentityPicker/);
  assert.doesNotMatch(header, /SITE_GUIDE_LINKS|siteChromeCopy\.nav\.guides/);
  assert.match(siteHeaders, /isHomePath/);
  assert.match(siteHeaders, /min-h-phone-bar/);
  assert.match(siteHeaders, /data-header-actions/);
  assert.match(actions, /#get-started/);
  assert.match(actions, /data-site-action/);
  assert.match(actions, /SITE_GITHUB_URL/);
  assert.match(actions, /OffPathLink/);
  assert.doesNotMatch(actions, /<GithubIcon|aria-label=\{siteChromeCopy\.nav\.github\}/);
  assert.doesNotMatch(actions, /target="_blank"/);
  assert.match(
    compact,
    /#nd-mobile-nav\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*var\(--zk-site-header-height\)/,
  );
  assert.match(
    compact,
    /#nd-nav,\s*\n#nd-nav > div,\s*\n#nd-nav nav\s*\{[^}]*height:\s*var\(--zk-site-header-height\)/,
  );
  assert.match(compact, /--zk-site-header-height-wrapped:\s*7\.5rem/);
  assert.match(compact, /\[data-header-actions\]/);
  assert.match(compact, /width < 48rem/);
  assert.match(compact, /--zk-docs-scroll-offset:\s*calc\(var\(--fd-docs-row-1, 0px\) \+ var\(--zk-site-header-height-wrapped\)\)/);
  const globals = readFileSync(join(app, "app/globals.css"), "utf8");
  assert.match(globals, /#nd-sidebar\s*\{[^}]*background-color:\s*hsl\(var\(--sidebar\)/);
  assert.match(layout, /themeSwitch=\{\{\s*enabled:\s*false\s*\}\}/);
  assert.doesNotMatch(layout, /KitVersionLabel/);
});

test("phone header wrap is two rows: nowrap nav list, 24px labels, actions take the second row", () => {
  const header = readFileSync(join(app, "ui/mobile-header.tsx"), "utf8");
  const compact = readFileSync(join(app, "app/site-compact.css"), "utf8");
  assert.match(header, /id="nd-mobile-nav"/);
  assert.match(header, /flex min-h-phone-bar flex-wrap items-center/);
  assert.match(header, /<ul className="flex list-none items-center flush">/);
  assert.doesNotMatch(header, /<ul className="[^"]*flex-wrap/);
  assert.match(
    compact,
    /#nd-mobile-nav nav a:not\(\[data-slot="button"\]\)\s*\{[^}]*min-width:\s*1\.5rem/,
  );
  assert.doesNotMatch(
    compact,
    /#nd-mobile-nav nav a:not\(\[data-slot="button"\]\)\s*\{[^}]*padding-inline:/,
  );
  assert.match(
    compact,
    /@media \(width < 48rem\)[\s\S]*?#nd-mobile-nav \[data-header-actions\]\s*\{[^}]*flex-basis:\s*100%/,
  );
  assert.match(
    compact,
    /@media \(width < 48rem\)[\s\S]*?#nd-mobile-nav \[data-header-actions\]\s*\{[^}]*justify-content:\s*flex-end/,
  );
  assert.match(
    compact,
    /@media \(width < 48rem\)[\s\S]*?#nd-mobile-nav \[data-header-actions\]\s*\{[^}]*flex-wrap:\s*nowrap/,
  );
  assert.match(
    compact,
    /:root\[data-identity\] :is\(#nd-nav\[data-home-header\] nav, #nd-nav\[data-catalog-header\] nav, #nd-mobile-nav, #nd-mobile-nav nav ul\) \{\s*gap: 1\.5rem;/,
  );
  assert.match(compact, /--zk-site-header-height-wrapped:\s*7\.5rem/);
});
