// Original work by the same author.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOOKS,
  PEER_HINT,
  PEER_MISSING,
  baselineAxeIds,
  cellHasVerdict,
  collectionFailedRecord,
  copySitsWithBlock,
  escapeHtml,
  identitiesFromChangedFiles,
  isAllowedRequest,
  isFaviconRequest,
  isSafeGitRef,
  looksGridTriggered,
  markdownTable,
  mdCell,
  newAxeIds,
  parseStatesFile,
  parseVisualVerifyArgs,
  peerHint,
  resolveManifestPath,
  resolveMockupForWidth,
  resolveStaticFile,
  routeStem,
  routesFromFiles,
  runVisualVerify,
  sanitizeBranch,
  ticketStateNames,
  unionRoutes,
  unwrapPeerModule,
  usageVisualVerify,
  visualReferencePath,
  visualVerifyMain,
} from "../scripts/visual-verify.mjs";

const CLEAN = `<!doctype html><html lang="en"><head><title>Home</title>
<link rel="icon" href="/favicon.ico">
<style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px;line-height:1.2}
</style></head><body><h1>Home</h1><p>Readable body copy.</p></body></html>`;

const OVERFLOW = `<!doctype html><html lang="en"><head><title>Overflow</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.wide{width:2000px;background:#eee}
</style></head><body><h1>Overflow</h1><div class="wide">stretched</div></body></html>`;

const CONTRAST = `<!doctype html><html lang="en"><head><title>Contrast</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
</style></head><body><h1>Contrast</h1><p>Body</p><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" width="16" height="16"></body></html>`;

const LOW_CONTRAST = `<!doctype html><html lang="en"><head><title>Low contrast</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.low{color:#eee;background:#fff}
</style></head><body><h1>Low contrast</h1><p class="low">pale on white</p></body></html>`;

const CLIPPED = `<!doctype html><html lang="en"><head><title>Clipped</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.clip{width:40px;overflow:hidden;white-space:nowrap}
</style></head><body><h1>Clipped</h1><p class="clip">this text is much too long to fit</p></body></html>`;

const SCROLLER = `<!doctype html><html lang="en"><head><title>Scroller</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.scroll{width:80px;overflow:auto;white-space:nowrap}
</style></head><body><h1>Scroller</h1><p class="scroll" tabindex="0">this text is much too long to fit</p></body></html>`;

const SR_ONLY_CLIP = `<!doctype html><html lang="en"><head><title>SR only</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0}
</style></head><body><h1>Hidden copy</h1><p>Visible. <span class="sr-only">(opens in a new tab)</span></p></body></html>`;

const LONG_INPUT = `<!doctype html><html lang="en"><head><title>Input</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
input{box-sizing:border-box;width:80px;min-width:24px;min-height:24px;overflow:clip}
</style></head><body><h1>Input</h1><label>Font <input value="Inter Variable, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji"></label></body></html>`;

const TRUNCATE_OK = `<!doctype html><html lang="en"><head><title>Truncate</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.truncate{width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style></head><body><h1>Truncate</h1><p class="truncate">this text is much too long to fit</p></body></html>`;

const WORD_ROLL_CLIP = `<!doctype html><html lang="en"><head><title>Roll</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.mask{width:40px;height:20px;overflow:hidden;white-space:nowrap}
</style></head><body><h1>Roll</h1><span data-word-roll-clip="" class="mask">this text is much too long to fit</span></body></html>`;

const RADIX_SCROLL = `<!doctype html><html lang="en"><head><title>Scroll area</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.view{width:80px;height:40px;overflow:hidden}
</style></head><body><h1>Scroll area</h1><div data-radix-scroll-area-viewport="" class="view">this text is much too long and tall to fit in the viewport box at all</div></body></html>`;

const BARE = `<!doctype html><html lang="en"><head><title>Bare</title></head><body><h1>Bare</h1><p>No stylesheet.</p></body></html>`;

const SMALL_TARGET = `<!doctype html><html lang="en"><head><title>Small</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button.tiny{display:inline-block;box-sizing:border-box;width:16px;height:16px;padding:0;margin:0;border:0;font-size:10px;line-height:16px}
</style></head><body><h1>Small</h1><button class="tiny" type="button">x</button></body></html>`;

const INLINE_LINK = `<!doctype html><html lang="en"><head><title>Inline</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
a{color:#00e}
</style></head><body><h1>Inline</h1><p>See the <a href="#more">inline link</a> here.</p><p id="more">More.</p></body></html>`;

const PADDED_TARGET = `<!doctype html><html lang="en"><head><title>Padded</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button.pad{display:inline-block;box-sizing:border-box;width:16px;height:16px;padding:0;margin:0;border:0;position:relative;font-size:10px;line-height:16px}
button.pad::before{content:"";position:absolute;left:0;top:0;width:24px;height:24px}
</style></head><body><h1>Padded</h1><button class="pad" type="button">x</button></body></html>`;

const DISTANT_PSEUDO = `<!doctype html><html lang="en"><head><title>Distant</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button.far{display:inline-block;box-sizing:border-box;width:16px;height:16px;padding:0;margin:0;border:0;position:relative;font-size:10px;line-height:16px}
button.far::before{content:"";position:absolute;left:100px;top:100px;width:24px;height:24px}
</style></head><body><h1>Distant</h1><button class="far" type="button">x</button></body></html>`;

const ARIA_HIDDEN_TARGET = `<!doctype html><html lang="en"><head><title>Hidden aria</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button.tiny{display:inline-block;box-sizing:border-box;width:16px;height:16px;padding:0;margin:0;border:0;font-size:10px;line-height:16px}
</style></head><body><h1>Hidden aria</h1><button class="tiny" type="button" aria-hidden="true">x</button></body></html>`;

const HIDDEN_NATIVE_SELECT = `<!doctype html><html lang="en"><head><title>Hidden select</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button{min-width:32px;min-height:32px}
</style></head><body>
<h1>Hidden select</h1>
<button type="button">Open</button>
<select aria-hidden="true" tabindex="-1" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"></select>
</body></html>`;

const POINTER_NONE_TARGET = `<!doctype html><html lang="en"><head><title>Pointer none</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button.tiny{display:inline-block;box-sizing:border-box;width:16px;height:16px;padding:0;margin:0;border:0;font-size:10px;line-height:16px;pointer-events:none}
</style></head><body><h1>Pointer none</h1><button class="tiny" type="button">x</button></body></html>`;

const DISABLED_TARGET = `<!doctype html><html lang="en"><head><title>Disabled</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button.tiny{display:inline-block;box-sizing:border-box;width:16px;height:16px;padding:0;margin:0;border:0;font-size:10px;line-height:16px}
</style></head><body><h1>Disabled</h1><button class="tiny" type="button" disabled>x</button></body></html>`;

const SR_ONLY_SKIP = `<!doctype html><html lang="en"><head><title>Skip</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;display:block}
</style></head><body>
<a class="sr-only" href="#main">Skip to content</a>
<main id="main"><h1>Skip</h1><p>Readable body copy.</p></main>
</body></html>`;

const BOOM = `<!doctype html><html lang="en"><head><title>Boom</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button{min-width:32px;min-height:32px}
</style></head><body>
<h1>Boom</h1>
<button type="button" id="boom">Boom</button>
<script>
document.getElementById("boom").addEventListener("click", () => {
  console.error("clicked-boom");
});
</script>
</body></html>`;

const STATES = `<!doctype html><html lang="en"><head><title>States</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
button{min-width:32px;min-height:32px}
[hidden]{display:none}
</style></head><body>
<h1>States</h1>
<button type="button" id="open">Open</button>
<div id="panel" hidden><p>Revealed panel.</p></div>
<script>
document.getElementById("open").addEventListener("click", () => {
  document.getElementById("panel").hidden = false;
});
</script>
</body></html>`;

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const TABS = `<!doctype html><html lang="en"><head><title>Tabs</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
[role=tab]{color:#111;background:#fff;border:1px solid #111;min-width:24px;min-height:24px}
.bad{color:#eee;background:#fff}
[hidden]{display:none}
</style></head><body>
<h1>Tabs</h1>
<div role="tablist">
  <button type="button" role="tab" id="t1" aria-selected="true" aria-controls="p1">One</button>
  <button type="button" role="tab" id="t2" aria-selected="false" aria-controls="p2">Two</button>
</div>
<div role="tabpanel" id="p1">Readable panel.</div>
<div role="tabpanel" id="p2" hidden><p class="bad">hidden low contrast</p></div>
<script>
document.querySelectorAll("[role=tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[role=tab]").forEach((t) => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
    document.querySelectorAll("[role=tabpanel]").forEach((p) => {
      p.hidden = p.id !== tab.getAttribute("aria-controls");
    });
  });
});
</script>
</body></html>`;

function fixtureDir() {
  const dir = mkdtempSync(join(tmpdir(), "visual-verify-"));
  writeFileSync(join(dir, "index.html"), CLEAN);
  writeFileSync(join(dir, "overflow.html"), OVERFLOW);
  writeFileSync(join(dir, "contrast.html"), CONTRAST);
  writeFileSync(join(dir, "low-contrast.html"), LOW_CONTRAST);
  writeFileSync(join(dir, "clipped.html"), CLIPPED);
  writeFileSync(join(dir, "scroller.html"), SCROLLER);
  writeFileSync(join(dir, "sr-only.html"), SR_ONLY_CLIP);
  writeFileSync(join(dir, "long-input.html"), LONG_INPUT);
  writeFileSync(join(dir, "truncate.html"), TRUNCATE_OK);
  writeFileSync(join(dir, "word-roll.html"), WORD_ROLL_CLIP);
  writeFileSync(join(dir, "radix-scroll.html"), RADIX_SCROLL);
  writeFileSync(join(dir, "bare.html"), BARE);
  writeFileSync(join(dir, "tabs.html"), TABS);
  writeFileSync(join(dir, "small.html"), SMALL_TARGET);
  writeFileSync(join(dir, "inline.html"), INLINE_LINK);
  writeFileSync(join(dir, "padded.html"), PADDED_TARGET);
  writeFileSync(join(dir, "distant.html"), DISTANT_PSEUDO);
  writeFileSync(join(dir, "aria-hidden.html"), ARIA_HIDDEN_TARGET);
  writeFileSync(join(dir, "hidden-select.html"), HIDDEN_NATIVE_SELECT);
  writeFileSync(join(dir, "pointer-none.html"), POINTER_NONE_TARGET);
  writeFileSync(join(dir, "disabled.html"), DISABLED_TARGET);
  writeFileSync(join(dir, "skip.html"), SR_ONLY_SKIP);
  writeFileSync(join(dir, "states.html"), STATES);
  writeFileSync(join(dir, "boom.html"), BOOM);
  return dir;
}

describe("visual-verify helpers", () => {
  it("maps App Router pages and optional docs-manifest sources to routes", () => {
    const files = [
      "apps/docs/app/(site)/page.tsx",
      "apps/docs/app/(site)/catalog/page.tsx",
      "packages/ui/src/button/button.tsx",
      "README.md",
    ];
    const manifest = {
      rich: {
        "Trigger actions with buttons": { source: "button/button.tsx" },
      },
    };
    expect(routesFromFiles(files, manifest).sort()).toEqual([
      "/",
      "/catalog",
      "/docs/ui/trigger-actions-with-buttons",
    ]);
    expect(routesFromFiles(["apps/docs/app/docs/[[...slug]]/page.tsx"])).toEqual([]);
    expect(
      routesFromFiles(["apps/docs/features/reviews/ui/review-console-view.tsx"]).sort(),
    ).toEqual(["/issues"]);
    expect(routesFromFiles(["apps/docs/app/(run-console)/issues/[n]/runs/[id]/page.tsx"])).toEqual([
      "/issues",
    ]);
    expect(routesFromFiles(["apps/docs/tests/evidence/issues/issues-list-1440.png"])).toEqual([
      "/issues",
    ]);
    expect(routesFromFiles(["apps/docs/scripts/issues-evidence-artifacts.test.mjs"])).toEqual([
      "/issues",
    ]);
  });

  it("maps docs identity feature modules to the editor route", () => {
    expect(
      routesFromFiles([
        "apps/docs/features/identity/ui/identity-look.ts",
        "apps/docs/features/identity/ui/identity-editor-panel.tsx",
        "apps/docs/features/identity/ui/identity-look.test.mjs",
        ".agents/atlas.md",
      ]),
    ).toEqual(["/features/identity-editor"]);
    expect(
      routesFromFiles(["apps\\docs\\features\\identity\\ui\\identity-editor-draft.ts"]),
    ).toEqual(["/features/identity-editor"]);
    expect(routesFromFiles(["apps/docs/features/identity/ui/identity-look.test.mjs"])).toEqual([]);
  });

  it("maps docs home route-group files to / when there is no page.tsx", () => {
    expect(
      routesFromFiles([
        "apps/docs/app/(home)/_home/home-identity-looks.tsx",
        "apps/docs/app/(home)/_home/home-identity-looks.test.mjs",
        ".agents/atlas.md",
      ]),
    ).toEqual(["/"]);
    expect(
      routesFromFiles(["apps\\docs\\app\\(home)\\_home\\home-identity-looks.tsx"]),
    ).toEqual(["/"]);
    expect(routesFromFiles(["apps/docs/app/(home)/_home/home-identity-looks.test.mjs"])).toEqual([]);
  });

  it("maps docs catalog private-folder files to /catalog when there is no page.tsx", () => {
    expect(
      routesFromFiles([
        "apps/docs/app/(site)/catalog/_catalog/catalog-results.tsx",
        "apps/docs/app/(site)/catalog/_catalog/catalog-shell.css",
        "apps/docs/app/(site)/catalog/_catalog/catalog-filter.test.mjs",
        ".agents/atlas.md",
      ]),
    ).toEqual(["/catalog"]);
    expect(
      routesFromFiles(["apps\\docs\\app\\(site)\\catalog\\_catalog\\catalog-results.tsx"]),
    ).toEqual(["/catalog"]);
    expect(
      routesFromFiles(["apps/docs/app/(site)/catalog/_catalog/catalog-filter.test.mjs"]),
    ).toEqual([]);
    const skill = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../kit/skills/visual-verify/SKILL.md"),
      "utf8",
    );
    expect(skill).toContain("apps/docs/app/(site)/catalog/**");
  });

  it("maps docs site-chrome files to / when there is no page.tsx", () => {
    expect(
      routesFromFiles([
        "apps/docs/components/site-chrome/route-scroll-reset.tsx",
        "apps/docs/components/site-chrome/site-layout.tsx",
        "apps/docs/components/site-chrome/route-scroll-reset.test.tsx",
        ".agents/atlas.md",
      ]),
    ).toEqual(["/"]);
    expect(
      routesFromFiles(["apps\\docs\\components\\site-chrome\\route-scroll-reset.tsx"]),
    ).toEqual(["/"]);
    expect(
      routesFromFiles(["apps/docs/components/site-chrome/route-scroll-reset.test.tsx"]),
    ).toEqual([]);
    const skill = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../kit/skills/visual-verify/SKILL.md"),
      "utf8",
    );
    expect(skill).toContain("apps/docs/components/site-chrome/**");
  });

  it("maps catalog demo files and kit source-family files from the docs manifest", () => {
    const catalog = {
      rich: {
        "Compose a live agent console from a run": {
          source: "layout/agent-console.tsx",
          demo: "AgentConsoleDemo",
        },
        "Show your brand logo": {
          source: "brand/brand-logo.tsx",
          demo: "BrandLogoDemo",
        },
        "Compose a public marketing page": {
          source: "marketing/glass-surface.tsx",
          demo: "GlassSurfaceDemo",
          examples: { "Header and footer": "MarketingChromeDemo" },
        },
        "Horizontal scroll gallery row": {
          source: "layout/scroll-gallery.tsx",
          demo: "ScrollGalleryIdentityDemo",
        },
      },
    };
    expect(
      routesFromFiles(
        [
          "packages/ui/src/layout/agent-console-model.ts",
          "apps/docs/components/demos/brand-logo-demo.tsx",
          "apps/docs/components/demos/marketing-demo.tsx",
          "apps/docs/components/demos/scroll-gallery-demo.tsx",
          "deploy/Caddyfile",
        ],
        catalog,
      ).sort(),
    ).toEqual([
      "/docs/ui/compose-a-live-agent-console-from-a-run",
      "/docs/ui/compose-a-public-marketing-page",
      "/docs/ui/horizontal-scroll-gallery-row",
      "/docs/ui/show-your-brand-logo",
    ]);
    expect(
      routesFromFiles(["packages/ui/tests/unit/agent-console.test.tsx"], catalog),
    ).toEqual([]);
    expect(routesFromFiles(["packages/ui/src/layout/agent-console-model.ts"])).toEqual([]);
  });

  it("loads apps/docs/docs-manifest.json when --manifest is omitted", () => {
    const host = mkdtempSync(join(tmpdir(), "zk-manifest-"));
    mkdirSync(join(host, "apps/docs"), { recursive: true });
    writeFileSync(join(host, "apps/docs/docs-manifest.json"), "{}");
    expect(resolveManifestPath(host, undefined)).toBe(join(host, "apps/docs/docs-manifest.json"));
    expect(resolveManifestPath(host, "custom.json")).toBe(join(host, "custom.json"));
    expect(resolveManifestPath(mkdtempSync(join(tmpdir(), "zk-empty-")), undefined)).toBe("");
  });

  it("documents the clipped skip list without overstating docs-render equivalence", () => {
    const skill = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../kit/skills/visual-verify/SKILL.md"),
      "utf8",
    );
    expect(skill).toContain("data-allow-clip");
    expect(skill).toContain("same idea as docs-render");
    expect(skill).not.toMatch(/same as docs-render/);
  });

  it("does not claim hit skips the clipped-only allow-clip attributes", () => {
    const atlas = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../.agents/atlas/visual-verify.md"),
      "utf8",
    );
    const row = atlas.split("\n").find((line) => line.includes("zedkit-ai visual-verify"));
    expect(row).toBeDefined();
    expect(row).not.toMatch(/Clipped and hit measures skip/);
    expect(row).toMatch(/Clipped also skips/);
  });

  it("maps guides MDX to /docs/<slug>", () => {
    expect(
      routesFromFiles([
        "apps/docs/prose/guides/foundations.mdx",
        "apps\\docs\\prose\\guides\\index.mdx",
        "apps/docs/prose/guides/snippets/ui-add.sh",
        "README.md",
      ]).sort(),
    ).toEqual(["/docs", "/docs/foundations"]);
  });

  it("maps docs guide feature modules to /docs/<slug> when there is no mdx", () => {
    expect(
      routesFromFiles([
        "apps/docs/features/docs/guides/foundations/ui/foundations-color.tsx",
        "apps/docs/features/docs/guides/foundations/i18n/foundations-copy.ts",
        "apps/docs/features/docs/guides/foundations/ui/foundations-hero.test.mjs",
        ".agents/atlas.md",
      ]),
    ).toEqual(["/docs/foundations"]);
    expect(
      routesFromFiles([
        "apps\\docs\\features\\docs\\guides\\maturity-and-compatibility\\ui\\maturity-compatibility-view.tsx",
      ]),
    ).toEqual(["/docs/maturity-and-compatibility"]);
    expect(
      routesFromFiles(["apps/docs/features/docs/guides/foundations/ui/foundations-hero.test.mjs"]),
    ).toEqual([]);
    const skill = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../kit/skills/visual-verify/SKILL.md"),
      "utf8",
    );
    expect(skill).toContain("apps/docs/features/docs/guides/<slug>/**");
  });

  it("maps AI setup sources to /docs/ai/setup", () => {
    expect(
      routesFromFiles(["packages/ai/kit/cursor-onboarding.md", "apps/docs/public/ai/setup.md"]).sort(),
    ).toEqual(["/docs/ai/setup"]);
  });

  it("turns the looks grid on for tokens, primitives, and identity sheets", () => {
    expect(looksGridTriggered(["packages/ui/src/identities.css"])).toBe(true);
    expect(looksGridTriggered(["packages/ui/src/styles.css"])).toBe(true);
    expect(looksGridTriggered(["packages/ui/src/button/button.tsx"])).toBe(true);
    expect(looksGridTriggered(["packages/ui/src/button/button.test.tsx"])).toBe(false);
    expect(looksGridTriggered(["README.md"])).toBe(false);
  });

  it("treats identities/<id>.css as the touched look, not the six-look grid", () => {
    expect(looksGridTriggered(["packages/ui/src/identities/glass.css"])).toBe(false);
    expect(identitiesFromChangedFiles(["packages/ui/src/identities/glass.css"])).toEqual(["glass"]);
    expect(identitiesFromChangedFiles(["packages\\ui\\src\\identities\\press.css"])).toEqual(["press"]);
    expect(
      identitiesFromChangedFiles([
        "packages/ui/src/identities/glass.css",
        "packages/ui/src/identities/press.css",
      ]),
    ).toEqual(["glass", "press"]);
    expect(identitiesFromChangedFiles(["packages/ui/src/identities.css"])).toEqual(DEFAULT_LOOKS);
    expect(identitiesFromChangedFiles(["packages/ui/src/styles.css"])).toEqual(DEFAULT_LOOKS);
    expect(identitiesFromChangedFiles(["packages/ui/src/button/button.tsx"])).toEqual(DEFAULT_LOOKS);
    expect(
      identitiesFromChangedFiles(["packages/ui/src/identities/glass.css", "packages/ui/src/identities.css"]),
    ).toEqual(DEFAULT_LOOKS);
    expect(identitiesFromChangedFiles(["README.md"])).toEqual([]);
  });

  it("parses --states as a JSON array of {name, click?}", () => {
    const empty = parseStatesFile("[]");
    expect(empty.ok).toBe(true);
    expect(empty.ok && empty.value).toEqual([]);
    const one = parseStatesFile('[{"name":"open panel","click":"#open"}]');
    expect(one.ok && one.value).toEqual([{ name: "open panel", click: "#open" }]);
    const nameless = parseStatesFile('[{"click":"#open"}]');
    expect(nameless.ok).toBe(false);
    const nameOnly = parseStatesFile('[{"name":"idle"}]');
    expect(nameOnly.ok && nameOnly.value).toEqual([{ name: "idle" }]);
    const badClick = parseStatesFile('[{"name":"x","click":123}]');
    expect(badClick.ok).toBe(false);
    expect(badClick.ok ? "" : badClick.error.message).toMatch(/invalid --states/u);
    const notArray = parseStatesFile("{}");
    expect(notArray.ok).toBe(false);
    const junk = parseStatesFile("not json");
    expect(junk.ok).toBe(false);
    expect(junk.ok ? "" : junk.error.message).toMatch(/invalid --states/u);
  });

  it("reads ticket States: names as unverified, and skips no transient states", () => {
    expect(ticketStateNames("# T\nStates: no transient states\n")).toEqual({ skip: true, unverified: [] });
    expect(ticketStateNames("States: open drawer, tab Two\n")).toEqual({
      skip: false,
      unverified: ["open drawer", "tab Two"],
    });
    expect(ticketStateNames("**States:** open drawer, tab Two\n")).toEqual({
      skip: false,
      unverified: ["open drawer", "tab Two"],
    });
    expect(ticketStateNames("**States:** no transient states\n")).toEqual({ skip: true, unverified: [] });
    expect(ticketStateNames("Visual reference: shots/home.png\n")).toEqual({ skip: false, unverified: [] });
  });

  it("resolves --mockup as a file, then {stem}-{width}.png, then {width}.png, then the only PNG", () => {
    const dir = mkdtempSync(join(tmpdir(), "mockup-"));
    const file = join(dir, "ref.png");
    writeFileSync(file, TINY_PNG);
    expect(resolveMockupForWidth(file, "/", 375, dir)).toBe(file);
    const nested = join(dir, "shots");
    mkdirSync(nested);
    writeFileSync(join(nested, "home-809.png"), TINY_PNG);
    writeFileSync(join(nested, "375.png"), TINY_PNG);
    expect(resolveMockupForWidth(nested, "/", 809, dir)).toBe(join(nested, "home-809.png"));
    expect(resolveMockupForWidth(nested, "/docs", 375, dir)).toBe(join(nested, "375.png"));
    const single = join(dir, "one");
    mkdirSync(single);
    writeFileSync(join(single, "only.png"), TINY_PNG);
    expect(resolveMockupForWidth(single, "/", 1440, dir)).toBe(join(single, "only.png"));
    expect(resolveMockupForWidth(join(dir, "missing.png"), "/", 375, dir)).toBeNull();
  });

  it("treats overlapping or header Copy buttons as sitting with the block", () => {
    const frame = { left: 10, right: 200, top: 40, bottom: 120 };
    expect(copySitsWithBlock({ left: 20, right: 80, top: 50, bottom: 70 }, frame)).toBe(true);
    expect(copySitsWithBlock({ left: 150, right: 190, top: 8, bottom: 32 }, frame)).toBe(true);
    expect(copySitsWithBlock({ left: 400, right: 440, top: 8, bottom: 32 }, frame)).toBe(false);
    expect(copySitsWithBlock({ left: 20, right: 80, top: -200, bottom: -180 }, frame)).toBe(false);
  });

  it("unwraps Playwright CJS default without dropping ESM named chromium", () => {
    expect(unwrapPeerModule({ default: { chromium: "cjs" } }, "chromium").chromium).toBe("cjs");
    expect(unwrapPeerModule({ chromium: "esm", default: { click: 1 } }, "chromium").chromium).toBe("esm");
    expect(unwrapPeerModule({ default: { analyze: 1 } }).analyze).toBe(1);
  });

  it("ignores favicon 404s and rejects a leading-dash git base", () => {
    expect(isFaviconRequest("http://127.0.0.1:9/favicon.ico")).toBe(true);
    expect(isFaviconRequest("http://127.0.0.1:9/overflow.css")).toBe(false);
    expect(isSafeGitRef("-n")).toBe(false);
    expect(isSafeGitRef("origin/dev")).toBe(true);
    expect(routeStem("/")).toBe("home");
    expect(routeStem("/docs\\ui:x")).toBe("docs_ui_x");
    expect(escapeHtml(`<mist">`)).toBe("&lt;mist&quot;&gt;");
    expect(peerHint("@axe-core/playwright")).toContain("@axe-core/playwright");
    expect(peerHint("@playwright/test")).toBe(PEER_HINT);
  });

  it("maps a static /foo request to foo.html", () => {
    const dir = fixtureDir();
    expect(resolveStaticFile(dir, "/overflow")).toBe(join(dir, "overflow.html"));
    expect(resolveStaticFile(dir, "/")).toBe(join(dir, "index.html"));
    expect(resolveStaticFile(dir, "/missing")).toBeNull();
  });

  it("omits verdict fields when collection failed", () => {
    const record = collectionFailedRecord("css");
    expect(record.collection).toBe("failed");
    expect(record).not.toHaveProperty("overflow");
    expect(record).not.toHaveProperty("axeNew");
    expect(cellHasVerdict({ collection: "failed", reason: "css" })).toBe(false);
    expect(cellHasVerdict({ collection: "ok", overflow: false })).toBe(true);
  });

  it("prints a Markdown table from the run record", () => {
    const table = markdownTable({
      cells: [
        {
          route: "/",
          width: 375,
          mode: "light",
          identity: undefined,
          collection: "ok",
          overflow: false,
          axeNew: [],
          h1: { count: 1, fontSize: 24, lines: 1, share: 0.05 },
        },
        {
          route: "/",
          width: 375,
          mode: "light",
          state: "open|drawer\nnext",
          collection: "ok",
          overflow: false,
          axeNew: [],
          hitTargets: { fail: true, count: 1, min: 16, failed: [{ tag: "button", box: { w: 16, h: 16 } }] },
          h1: { count: 1, fontSize: 24, lines: 1, share: 0.05 },
        },
      ],
    });
    expect(table).toContain("| / | 375 | light |");
    expect(table).toContain("| ok |");
    expect(table).toContain("new serious axe");
    expect(table).toContain("h1 size");
    expect(table).toContain("h1 share of viewport");
    expect(table).toContain("| state |");
    expect(table).toContain("| hit |");
    expect(table).toContain("fail button 16×16");
    expect(table).not.toMatch(/open\|drawer/u);
    expect(table).toContain("open drawer next");
    expect(mdCell("a|b\r\nc")).toBe("a b c");
  });

  it("reads Visual reference paths and sanitizes branch names", () => {
    expect(visualReferencePath("# Ticket\nVisual reference: shots/home.png\n")).toBe("shots/home.png");
    expect(sanitizeBranch("feat/issue-323")).toBe("feat-issue-323");
  });

  it("unions routes and blocks off-origin requests", () => {
    expect(unionRoutes(["/docs"], ["/", "/docs"])).toEqual(["/", "/docs"]);
    expect(isAllowedRequest("http://127.0.0.1:9/x", "http://127.0.0.1:9")).toBe(true);
    expect(isAllowedRequest("https://example.com/x", "http://127.0.0.1:9")).toBe(false);
    expect(isAllowedRequest("data:text/plain,x", "http://127.0.0.1:9")).toBe(true);
  });

  it("counts only new serious axe ids against the baseline", () => {
    expect(newAxeIds([{ id: "color-contrast", impact: "serious" }], new Set())).toEqual(["color-contrast"]);
    expect(newAxeIds([{ id: "color-contrast", impact: "serious" }], new Set(["color-contrast"]))).toEqual([]);
    expect(baselineAxeIds({ cells: [{ axeIds: ["color-contrast"] }] }).has("color-contrast")).toBe(true);
  });

  it("documents the visual-verify flags", () => {
    const text = usageVisualVerify();
    for (const flag of ["--url", "--dir", "--changed", "--base", "--cwd", "--routes", "--identities", "--baseline", "--out", "--md", "--ticket", "--manifest", "--states", "--mockup"]) {
      expect(text).toContain(flag);
    }
    expect(text).toContain("evidence/<branch>/manifest.json");
    expect(text).toContain("Missing Playwright/axe peers");
    expect(text).toContain("invalid --states");
    expect(text).toContain("missing --states");
    expect(text).toContain("page/console/HTTP");
    expect(text).toContain("JSON array of {name, click?}");
    expect(text).toContain("wins over Visual reference");
    expect(text).toContain("apps/docs/docs-manifest.json");
    const parsed = parseVisualVerifyArgs(["--help"]);
    expect(parsed.ok && parsed.value.help).toBe(true);
  });

  it("aliases --base-url to --url and --routes auto to --changed", () => {
    const aliased = parseVisualVerifyArgs(["--base-url", "http://127.0.0.1:9", "--routes", "auto"]);
    expect(aliased.ok).toBe(true);
    if (!aliased.ok) return;
    expect(aliased.value.url).toBe("http://127.0.0.1:9");
    expect(aliased.value.changed).toBe(true);
    expect(aliased.value.routes).toEqual([]);
    const mixed = parseVisualVerifyArgs(["--routes", "auto,/docs"]);
    expect(mixed.ok && mixed.value.changed).toBe(true);
    expect(mixed.ok && mixed.value.routes).toEqual(["/docs"]);
    const both = parseVisualVerifyArgs(["--url", "http://127.0.0.1:9", "--base-url", "http://127.0.0.1:8"]);
    expect(both.ok).toBe(false);
    const extras = parseVisualVerifyArgs(["--states", "states.json", "--mockup", "mockups/"]);
    expect(extras.ok && extras.value.states).toBe("states.json");
    expect(extras.ok && extras.value.mockup).toBe("mockups/");
  });

  it("defaults widths and modes to the Visual work matrix", () => {
    const parsed = parseVisualVerifyArgs([]);
    expect(parsed.ok && parsed.value.widths).toEqual([375, 809, 1440]);
    expect(parsed.ok && parsed.value.modes).toEqual(["light", "dark"]);
    expect(parsed.ok && parsed.value.changed).toBe(true);
    const shrunk = parseVisualVerifyArgs(["--widths", "375", "--modes", "light"]);
    expect(shrunk.ok && shrunk.value.widths).toEqual([375]);
    expect(shrunk.ok && shrunk.value.modes).toEqual(["light"]);
    const explicit = parseVisualVerifyArgs(["--routes", "/docs"]);
    expect(explicit.ok && explicit.value.changed).toBe(false);
    expect(explicit.ok && explicit.value.routes).toEqual(["/docs"]);
  });
});

describe("visual-verify CLI", () => {
  it("prints usage on --help and exits 0", async () => {
    const out = [];
    const errors = [];
    const code = await visualVerifyMain(["--help"], { out: (l) => out.push(l), err: (l) => errors.push(l) });
    expect(code).toBe(0);
    expect(out.join("\n")).toContain("--url");
    expect(errors).toEqual([]);
  });

  it("names --base-url, --routes, and --out on evidence --help", async () => {
    const out = [];
    const code = await visualVerifyMain(["--help"], {
      out: (l) => out.push(l),
      err: () => undefined,
    }, { command: "evidence" });
    expect(code).toBe(0);
    const text = out.join("\n");
    expect(text).toContain("zedkit-ai evidence");
    expect(text).toContain("--base-url");
    expect(text).toContain("--routes");
    expect(text).toContain("--out");
    expect(text).toContain("--states");
    expect(text).toContain("--mockup");
    expect(text).toContain("JSON array of {name, click?}");
    expect(text).toContain("file or directory of width PNGs");
  });

  it("rejects --url and --base-url together before launch", async () => {
    let launched = false;
    const errors = [];
    const code = await visualVerifyMain(
      ["--url", "http://127.0.0.1:9", "--base-url", "http://127.0.0.1:8", "--routes", "/"],
      { out: () => undefined, err: (l) => errors.push(l) },
      {
        loadPlaywright: async () => {
          launched = true;
          return { ok: true, value: { chromium: {} } };
        },
      },
    );
    expect(code).toBe(2);
    expect(launched).toBe(false);
    expect(errors.join("\n")).toMatch(/--url|--base-url/);
  });

  it("exits 2 when Playwright is missing, without crashing", async () => {
    const errors = [];
    const code = await visualVerifyMain(["--dir", fixtureDir(), "--routes", "/"], {
      out: () => undefined,
      err: (l) => errors.push(l),
    }, { loadPlaywright: async () => ({ ok: false, error: new Error(PEER_HINT) }) });
    expect(code).toBe(2);
    expect(errors.join("\n")).toContain(PEER_HINT);
  });

  it("exits 2 on a malformed --states file before launch", async () => {
    const dir = fixtureDir();
    writeFileSync(join(dir, "states.json"), "{not json");
    let launched = false;
    const errors = [];
    const code = await visualVerifyMain(
      ["--dir", dir, "--routes", "/", "--states", join(dir, "states.json")],
      { out: () => undefined, err: (l) => errors.push(l) },
      {
        loadPlaywright: async () => {
          launched = true;
          return { ok: true, value: { chromium: {} } };
        },
      },
    );
    expect(code).toBe(2);
    expect(launched).toBe(false);
    expect(errors.join("\n")).toMatch(/invalid --states/u);
  });

  it("exits 2 on a missing --states file before launch", async () => {
    const dir = fixtureDir();
    let launched = false;
    const errors = [];
    const code = await visualVerifyMain(
      ["--dir", dir, "--routes", "/", "--states", join(dir, "nope.json")],
      { out: () => undefined, err: (l) => errors.push(l) },
      {
        loadPlaywright: async () => {
          launched = true;
          return { ok: true, value: { chromium: {} } };
        },
      },
    );
    expect(code).toBe(2);
    expect(launched).toBe(false);
    expect(errors.join("\n")).toMatch(/missing --states/u);
  });

  it("exits 2 on a missing --mockup path before launch", async () => {
    const dir = fixtureDir();
    let launched = false;
    const errors = [];
    const code = await visualVerifyMain(
      ["--dir", dir, "--routes", "/", "--mockup", join(dir, "nope.png")],
      { out: () => undefined, err: (l) => errors.push(l) },
      {
        loadPlaywright: async () => {
          launched = true;
          return { ok: true, value: { chromium: {} } };
        },
      },
    );
    expect(code).toBe(2);
    expect(launched).toBe(false);
    expect(errors.join("\n")).toMatch(/missing --mockup/u);
  });

  it("exits 2 on a non-string --states click before launch", async () => {
    const dir = fixtureDir();
    writeFileSync(join(dir, "states.json"), JSON.stringify([{ name: "x", click: 123 }]));
    let launched = false;
    const errors = [];
    const code = await visualVerifyMain(
      ["--dir", dir, "--routes", "/", "--states", join(dir, "states.json")],
      { out: () => undefined, err: (l) => errors.push(l) },
      {
        loadPlaywright: async () => {
          launched = true;
          return { ok: true, value: { chromium: {} } };
        },
      },
    );
    expect(code).toBe(2);
    expect(launched).toBe(false);
    expect(errors.join("\n")).toMatch(/invalid --states/u);
  });

  it("exits 2 on a tagged peer failure whose message does not contain install", async () => {
    const error = new Error("no browser");
    error.code = PEER_MISSING;
    const code = await visualVerifyMain(["--dir", fixtureDir(), "--routes", "/"], {
      out: () => undefined,
      err: () => undefined,
    }, { loadPlaywright: async () => ({ ok: false, error }) });
    expect(code).toBe(2);
  });
});

describe("visual-verify fixture", { timeout: 120_000 }, () => {
  async function runRoutes(routes, extra = {}) {
    const dir = fixtureDir();
    const out = mkdtempSync(join(tmpdir(), "vv-out-"));
    mkdirSync(out, { recursive: true });
    const result = await runVisualVerify({
      dir,
      routes,
      out,
      cwd: dir,
      ...extra,
    });
    return { result, out };
  }

  it("exits 0 on a clean page with no network", async () => {
    const { result, out } = await runRoutes(["/"]);
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.collection).toBe("ok");
    expect(readFileSync(join(out, "manifest.json"), "utf8")).toContain('"route": "/"');
    const summary = readFileSync(join(out, "summary.md"), "utf8");
    expect(summary).toContain("| / |");
    expect(summary).toMatch(/\npass\n/u);
    expect(summary).toContain("manifest.json");
    expect(result.value.contactSheets.some((s) => s.route === "/")).toBe(true);
    expect(result.value.cells.every((c) => c.clipped === false)).toBe(true);
    expect(result.value.cells.every((c) => c.hitTargets?.min === null && c.hitTargets?.fail === false)).toBe(true);
  });

  it("fails on planted overflow", async () => {
    const { result } = await runRoutes(["/overflow"]);
    expect(result.ok).toBe(true);
    expect(result.value.ok).toBe(false);
    expect(result.value.cells.some((c) => c.overflow === true)).toBe(true);
    expect(result.value.cells.filter((c) => c.collection === "ok").every(cellHasVerdict)).toBe(true);
  });

  it("fails on a new serious axe violation", async () => {
    const { result } = await runRoutes(["/contrast"]);
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(false);
    expect(result.value.cells.some((c) => (c.axeNew ?? []).length > 0)).toBe(true);
  });

  it("fails on planted low-contrast text", async () => {
    const { result } = await runRoutes(["/low-contrast"], { widths: [375], modes: ["light"] });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(false);
    expect(result.value.cells.some((c) => (c.axeNew ?? []).includes("color-contrast"))).toBe(true);
  });

  it("fails on planted clipped text", async () => {
    const { result } = await runRoutes(["/clipped"], { widths: [375], modes: ["light"] });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(false);
    expect(result.value.cells.some((c) => c.clipped === true && c.clippedCount > 0)).toBe(true);
    expect(result.value.cells.filter((c) => c.collection === "ok").every((c) => c.clipped === true)).toBe(true);
  });

  it("does not treat an intended scroller as clipped", async () => {
    const { result } = await runRoutes(["/scroller"], { widths: [375], modes: ["light"] });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.cells.every((c) => c.clipped === false)).toBe(true);
  });

  it("does not treat sr-only, native inputs, or truncate as clipped text", async () => {
    for (const route of ["/sr-only", "/long-input", "/truncate"]) {
      const { result } = await runRoutes([route], { widths: [375], modes: ["light"] });
      expect(result.ok, result.ok ? "" : `${route} ${result.error.message}`).toBe(true);
      expect(result.value.ok, route).toBe(true);
      expect(result.value.cells.every((c) => c.clipped === false), route).toBe(true);
    }
  });

  it("does not treat the kit word-roll animation mask as clipped text", async () => {
    const { result } = await runRoutes(["/word-roll"], { widths: [375], modes: ["light"] });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.cells.every((c) => c.clipped === false)).toBe(true);
  });

  it("does not treat a Radix scroll viewport as clipped text", async () => {
    const { result } = await runRoutes(["/radix-scroll"], { widths: [375], modes: ["light"] });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.cells.every((c) => c.clipped === false)).toBe(true);
  });

  it("fails collection with no CSS and writes no pass verdict", async () => {
    const { result } = await runRoutes(["/bare"]);
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(false);
    expect(result.value.collection).toBe("failed");
    expect(result.value.cells.every((c) => !cellHasVerdict(c))).toBe(true);
    expect(result.value.cells.every((c) => !("screenshot" in c))).toBe(true);
  });

  it("runs axe and the screenshot on the default tab before clicking", async () => {
    const { result } = await runRoutes(["/tabs"]);
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.cells.every((c) => (c.axeNew ?? []).length === 0)).toBe(true);
    expect(result.value.cells.some((c) => (c.selectedContrast?.count ?? 0) >= 2)).toBe(true);
  });

  it("rejects an empty identities list and a corrupt baseline before launch", async () => {
    const dir = fixtureDir();
    const out = mkdtempSync(join(tmpdir(), "vv-out-"));
    const empty = await runVisualVerify({ dir, routes: ["/"], identities: [], out, cwd: dir }, {
      loadPlaywright: async () => ({ ok: true, value: { chromium: { launch: async () => ({}) } } }),
      loadAxe: async () => ({ ok: true, value: class Axe {} }),
    });
    expect(empty.ok).toBe(false);
    expect(empty.error.message).toContain("no identities");
    const baseline = join(dir, "baseline.json");
    writeFileSync(baseline, "{not json");
    const corrupt = await runVisualVerify({ dir, routes: ["/"], baseline, out, cwd: dir }, {
      loadPlaywright: async () => ({ ok: true, value: { chromium: { launch: async () => ({}) } } }),
      loadAxe: async () => ({ ok: true, value: class Axe {} }),
    });
    expect(corrupt.ok).toBe(false);
    expect(corrupt.error.message).toContain("unreadable baseline");
  });

  it("fails on a planted 16px button and skips an inline sentence link", async () => {
    const small = await runRoutes(["/small"], { widths: [375], modes: ["light"] });
    expect(small.result.ok, small.result.ok ? "" : small.result.error.message).toBe(true);
    expect(small.result.value.ok).toBe(false);
    expect(small.result.value.cells.some((c) => c.hitTargets?.fail === true && c.hitTargets.min < 24)).toBe(true);
    expect(small.result.value.cells.some((c) => c.hitTargets?.failed?.[0]?.tag === "button")).toBe(true);
    expect(readFileSync(join(small.out, "summary.md"), "utf8")).toMatch(/fail button/u);
    const inline = await runRoutes(["/inline"], { widths: [375], modes: ["light"] });
    expect(inline.result.ok, inline.result.ok ? "" : inline.result.error.message).toBe(true);
    expect(inline.result.value.ok).toBe(true);
    expect(inline.result.value.cells.every((c) => c.hitTargets?.fail === false)).toBe(true);
    const padded = await runRoutes(["/padded"], { widths: [375], modes: ["light"] });
    expect(padded.result.ok, padded.result.ok ? "" : padded.result.error.message).toBe(true);
    expect(padded.result.value.ok).toBe(true);
    expect(padded.result.value.cells.every((c) => c.hitTargets?.fail === false)).toBe(true);
    const distant = await runRoutes(["/distant"], { widths: [375], modes: ["light"] });
    expect(distant.result.ok, distant.result.ok ? "" : distant.result.error.message).toBe(true);
    expect(distant.result.value.ok).toBe(false);
    expect(distant.result.value.cells.some((c) => c.hitTargets?.fail === true)).toBe(true);
    const ariaHidden = await runRoutes(["/aria-hidden"], { widths: [375], modes: ["light"] });
    expect(ariaHidden.result.ok, ariaHidden.result.ok ? "" : ariaHidden.result.error.message).toBe(true);
    expect(ariaHidden.result.value.ok).toBe(false);
    expect(ariaHidden.result.value.cells.some((c) => c.hitTargets?.fail === true)).toBe(true);
    const hiddenSelect = await runRoutes(["/hidden-select"], { widths: [375], modes: ["light"] });
    expect(hiddenSelect.result.ok, hiddenSelect.result.ok ? "" : hiddenSelect.result.error.message).toBe(true);
    expect(hiddenSelect.result.value.ok).toBe(true);
    expect(hiddenSelect.result.value.cells.every((c) => c.hitTargets?.fail === false)).toBe(true);
    const pointerNone = await runRoutes(["/pointer-none"], { widths: [375], modes: ["light"] });
    expect(pointerNone.result.ok, pointerNone.result.ok ? "" : pointerNone.result.error.message).toBe(true);
    expect(pointerNone.result.value.ok).toBe(true);
    expect(pointerNone.result.value.cells.every((c) => c.hitTargets?.fail === false)).toBe(true);
    const disabled = await runRoutes(["/disabled"], { widths: [375], modes: ["light"] });
    expect(disabled.result.ok, disabled.result.ok ? "" : disabled.result.error.message).toBe(true);
    expect(disabled.result.value.ok).toBe(true);
    expect(disabled.result.value.cells.every((c) => c.hitTargets?.fail === false)).toBe(true);
    const srOnly = await runRoutes(["/sr-only"], { widths: [375], modes: ["light"] });
    expect(srOnly.result.ok, srOnly.result.ok ? "" : srOnly.result.error.message).toBe(true);
    expect(srOnly.result.value.ok).toBe(true);
    expect(srOnly.result.value.cells.every((c) => c.hitTargets?.fail === false && c.clipped === false)).toBe(true);
    const skipLink = await runRoutes(["/skip"], { widths: [375], modes: ["light"] });
    expect(skipLink.result.ok, skipLink.result.ok ? "" : skipLink.result.error.message).toBe(true);
    expect(skipLink.result.value.ok).toBe(true);
    expect(skipLink.result.value.cells.every((c) => c.hitTargets?.fail === false && c.clipped === false)).toBe(true);
  });

  it("captures --states clicks as extra cells and skips no transient states", async () => {
    const dir = fixtureDir();
    const out = mkdtempSync(join(tmpdir(), "vv-out-"));
    const statesPath = join(dir, "states.json");
    writeFileSync(statesPath, JSON.stringify([{ name: "open panel", click: "#open" }]));
    const withStates = await runVisualVerify({
      dir,
      routes: ["/states"],
      out,
      cwd: dir,
      widths: [375],
      modes: ["light"],
      states: statesPath,
    });
    expect(withStates.ok, withStates.ok ? "" : withStates.error.message).toBe(true);
    expect(withStates.value.ok).toBe(true);
    expect(withStates.value.cells).toHaveLength(2);
    expect(withStates.value.cells[0].state).toBeUndefined();
    expect(withStates.value.cells[1].state).toBe("open panel");
    expect(withStates.value.cells[1].screenshot).toBeTruthy();
    expect(existsSync(withStates.value.cells[1].screenshot)).toBe(true);
    const ticket = join(dir, "ISSUE.md");
    writeFileSync(ticket, "# T\nStates: no transient states\n");
    const none = await runVisualVerify({
      dir,
      routes: ["/states"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      ticket,
    });
    expect(none.ok, none.ok ? "" : none.error.message).toBe(true);
    expect(none.value.cells).toHaveLength(1);
    expect(none.value.cells[0].state).toBeUndefined();
  });

  it("records English States: names as unverified without failing a clean page", async () => {
    const dir = fixtureDir();
    const ticket = join(dir, "ISSUE.md");
    writeFileSync(ticket, "# T\nStates: open drawer, tab Two\n");
    const result = await runVisualVerify({
      dir,
      routes: ["/"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      ticket,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.cells).toHaveLength(1);
    expect(result.value.statesUnverified).toEqual(["open drawer", "tab Two"]);
    expect(readFileSync(join(result.value.outDir, "summary.md"), "utf8")).toContain(
      "statesUnverified: open drawer, tab Two",
    );
    writeFileSync(ticket, "# T\n**States:** open drawer, tab Two\n");
    const bold = await runVisualVerify({
      dir,
      routes: ["/"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      ticket,
    });
    expect(bold.ok, bold.ok ? "" : bold.error.message).toBe(true);
    expect(bold.value.statesUnverified).toEqual(["open drawer", "tab Two"]);
    expect(readFileSync(join(bold.value.outDir, "summary.md"), "utf8")).toContain("statesUnverified:");
  });

  it("writes a non-blocking mockup pair PNG when --mockup is a file", async () => {
    const dir = fixtureDir();
    const mockup = join(dir, "ref.png");
    writeFileSync(mockup, TINY_PNG);
    const out = mkdtempSync(join(tmpdir(), "vv-out-"));
    const result = await runVisualVerify({
      dir,
      routes: ["/"],
      out,
      cwd: dir,
      widths: [375, 809, 1440],
      modes: ["light"],
      mockup,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(existsSync(join(out, "pair-home.png"))).toBe(true);
    expect(result.value.pairs?.some((p) => p.route === "/" && p.path.endsWith("pair-home.png"))).toBe(true);
  });

  it("writes a pair PNG from ticket Visual reference: when --mockup is omitted", async () => {
    const dir = fixtureDir();
    const mockup = join(dir, "ref.png");
    writeFileSync(mockup, TINY_PNG);
    const ticket = join(dir, "ISSUE.md");
    writeFileSync(ticket, "Visual reference: ref.png\n");
    const out = mkdtempSync(join(tmpdir(), "vv-out-"));
    const result = await runVisualVerify({
      dir,
      routes: ["/"],
      out,
      cwd: dir,
      widths: [375],
      modes: ["light"],
      ticket,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(existsSync(join(out, "pair-home.png"))).toBe(true);
  });

  it("warns and writes no pair when --mockup is an empty directory", async () => {
    const dir = fixtureDir();
    const mockup = join(dir, "empty-mockups");
    mkdirSync(mockup);
    const out = mkdtempSync(join(tmpdir(), "vv-out-"));
    const result = await runVisualVerify({
      dir,
      routes: ["/"],
      out,
      cwd: dir,
      widths: [375],
      modes: ["light"],
      mockup,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.pairs ?? []).toEqual([]);
    expect(result.value.warnings?.some((w) => /unresolvable --mockup/u.test(w))).toBe(true);
    expect(existsSync(join(out, "pair-home.png"))).toBe(false);
  });

  it("keeps uncovered ticket States: names when --states is partial", async () => {
    const dir = fixtureDir();
    const ticket = join(dir, "ISSUE.md");
    writeFileSync(ticket, "**States:** open panel, tab Two\n");
    const statesPath = join(dir, "states.json");
    writeFileSync(statesPath, JSON.stringify([{ name: "open panel", click: "#open" }]));
    const result = await runVisualVerify({
      dir,
      routes: ["/states"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      ticket,
      states: statesPath,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.statesTicket).toEqual(["open panel", "tab Two"]);
    expect(result.value.statesUnverified).toEqual(["tab Two"]);
    expect(result.value.warnings?.some((w) => /tab Two/u.test(w))).toBe(true);
    expect(readFileSync(join(result.value.outDir, "summary.md"), "utf8")).toContain("statesUnverified: tab Two");
  });

  it("captures a name-only --states cell and fails a missing click", async () => {
    const dir = fixtureDir();
    const nameOnlyPath = join(dir, "name-only.json");
    writeFileSync(nameOnlyPath, JSON.stringify([{ name: "idle" }]));
    const idle = await runVisualVerify({
      dir,
      routes: ["/states"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      states: nameOnlyPath,
    });
    expect(idle.ok, idle.ok ? "" : idle.error.message).toBe(true);
    expect(idle.value.ok).toBe(true);
    expect(idle.value.cells).toHaveLength(2);
    expect(idle.value.cells[1].state).toBe("idle");
    expect(idle.value.cells[1].collection).toBe("ok");
    const missPath = join(dir, "miss.json");
    writeFileSync(missPath, JSON.stringify([{ name: "gone", click: "#missing" }]));
    const missed = await runVisualVerify({
      dir,
      routes: ["/states"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      states: missPath,
    });
    expect(missed.ok, missed.ok ? "" : missed.error.message).toBe(true);
    expect(missed.value.ok).toBe(false);
    expect(missed.value.cells.some((c) => c.state === "gone" && c.collection === "failed")).toBe(true);
  });

  it("counts console errors caused by a state click", async () => {
    const dir = fixtureDir();
    const statesPath = join(dir, "boom.json");
    writeFileSync(statesPath, JSON.stringify([{ name: "boom", click: "#boom" }]));
    const result = await runVisualVerify({
      dir,
      routes: ["/boom"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      states: statesPath,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.cells[0].consoleErrors).toBe(0);
    expect(result.value.cells[1].state).toBe("boom");
    expect(result.value.cells[1].consoleErrors).toBeGreaterThan(0);
    expect(result.value.ok).toBe(false);
  });

  it("writes distinct screenshots when state names share a route stem", async () => {
    const dir = fixtureDir();
    const statesPath = join(dir, "stems.json");
    writeFileSync(statesPath, JSON.stringify([{ name: "a b" }, { name: "a-b" }]));
    const result = await runVisualVerify({
      dir,
      routes: ["/"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      states: statesPath,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    const shots = result.value.cells.map((c) => c.screenshot).filter(Boolean);
    expect(new Set(shots).size).toBe(shots.length);
    expect(shots.every((p) => existsSync(p))).toBe(true);
  });

  it("records --identities on cells and looksGrid", async () => {
    const dir = fixtureDir();
    const result = await runVisualVerify({
      dir,
      routes: ["/"],
      out: mkdtempSync(join(tmpdir(), "vv-out-")),
      cwd: dir,
      widths: [375],
      modes: ["light"],
      identities: ["mist"],
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.looksGrid).toBe(true);
    expect(result.value.cells.every((c) => c.identity === "mist")).toBe(true);
  });
});
