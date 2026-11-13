// Original work by the same author.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PEER_HINT,
  PEER_MISSING,
  baselineAxeIds,
  cellHasVerdict,
  collectionFailedRecord,
  copySitsWithBlock,
  escapeHtml,
  isAllowedRequest,
  isFaviconRequest,
  isSafeGitRef,
  looksGridTriggered,
  markdownTable,
  newAxeIds,
  parseVisualVerifyArgs,
  peerHint,
  resolveStaticFile,
  routeStem,
  routesFromFiles,
  runVisualVerify,
  sanitizeBranch,
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

const BARE = `<!doctype html><html lang="en"><head><title>Bare</title></head><body><h1>Bare</h1><p>No stylesheet.</p></body></html>`;

const TABS = `<!doctype html><html lang="en"><head><title>Tabs</title><style>
html,body{margin:0;background:#fff;color:#111;font:16px sans-serif}
h1{font-size:24px}
[role=tab]{color:#111;background:#fff;border:1px solid #111}
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
  writeFileSync(join(dir, "bare.html"), BARE);
  writeFileSync(join(dir, "tabs.html"), TABS);
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
  });

  it("turns the looks grid on for tokens, primitives, and identity sheets", () => {
    expect(looksGridTriggered(["packages/ui/src/identities.css"])).toBe(true);
    expect(looksGridTriggered(["packages/ui/src/styles.css"])).toBe(true);
    expect(looksGridTriggered(["packages/ui/src/button/button.tsx"])).toBe(true);
    expect(looksGridTriggered(["packages/ui/src/button/button.test.tsx"])).toBe(false);
    expect(looksGridTriggered(["README.md"])).toBe(false);
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
      ],
    });
    expect(table).toContain("| / | 375 | light |");
    expect(table).toContain("| ok |");
    expect(table).toContain("new serious axe");
    expect(table).toContain("h1 size");
    expect(table).toContain("h1 share of viewport");
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
    for (const flag of ["--url", "--dir", "--changed", "--base", "--cwd", "--routes", "--identities", "--baseline", "--out", "--md", "--ticket", "--manifest"]) {
      expect(text).toContain(flag);
    }
    expect(text).toContain("evidence/<branch>/manifest.json");
    expect(text).toContain("peers exit 2");
    expect(text).toContain("page/console/HTTP");
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
  });

  it("defaults widths and modes to the Visual work matrix", () => {
    const parsed = parseVisualVerifyArgs([]);
    expect(parsed.ok && parsed.value.widths).toEqual([375, 809, 1440]);
    expect(parsed.ok && parsed.value.modes).toEqual(["light", "dark"]);
    const shrunk = parseVisualVerifyArgs(["--widths", "375", "--modes", "light"]);
    expect(shrunk.ok && shrunk.value.widths).toEqual([375]);
    expect(shrunk.ok && shrunk.value.modes).toEqual(["light"]);
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
});
