// Original work by the same author.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PEER_HINT,
  baselineAxeIds,
  cellHasVerdict,
  collectionFailedRecord,
  contrastRatio,
  copySitsWithBlock,
  isAllowedRequest,
  looksGridTriggered,
  markdownTable,
  newAxeIds,
  parseVisualVerifyArgs,
  resolveStaticFile,
  routesFromFiles,
  runVisualVerify,
  sanitizeBranch,
  unionRoutes,
  usageVisualVerify,
  visualReferencePath,
  visualVerifyMain,
} from "../scripts/visual-verify.mjs";

const CLEAN = `<!doctype html><html lang="en"><head><title>Home</title><style>
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

const BARE = `<!doctype html><html lang="en"><head><title>Bare</title></head><body><h1>Bare</h1><p>No stylesheet.</p></body></html>`;

function fixtureDir() {
  const dir = mkdtempSync(join(tmpdir(), "visual-verify-"));
  writeFileSync(join(dir, "index.html"), CLEAN);
  writeFileSync(join(dir, "overflow.html"), OVERFLOW);
  writeFileSync(join(dir, "contrast.html"), CONTRAST);
  writeFileSync(join(dir, "bare.html"), BARE);
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
  });

  it("computes WCAG contrast for black on white as 21", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBe(21);
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
    for (const flag of ["--url", "--dir", "--changed", "--base", "--routes", "--identities", "--baseline", "--out", "--md", "--ticket"]) {
      expect(text).toContain(flag);
    }
    const parsed = parseVisualVerifyArgs(["--help"]);
    expect(parsed.ok && parsed.value.help).toBe(true);
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

  it("exits 2 when Playwright is missing, without crashing", async () => {
    const errors = [];
    const code = await visualVerifyMain(["--dir", fixtureDir(), "--routes", "/"], {
      out: () => undefined,
      err: (l) => errors.push(l),
    }, { loadPlaywright: async () => ({ ok: false, error: new Error(PEER_HINT) }) });
    expect(code).toBe(2);
    expect(errors.join("\n")).toContain(PEER_HINT);
  });
});

describe("visual-verify fixture", { timeout: 120_000 }, () => {
  async function runRoutes(routes) {
    const dir = fixtureDir();
    const out = mkdtempSync(join(tmpdir(), "vv-out-"));
    mkdirSync(out, { recursive: true });
    const result = await runVisualVerify({
      dir,
      routes,
      out,
      cwd: dir,
    });
    return { result, out };
  }

  it("exits 0 on a clean page with no network", async () => {
    const { result, out } = await runRoutes(["/"]);
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    expect(result.value.ok).toBe(true);
    expect(result.value.collection).toBe("ok");
    expect(readFileSync(join(out, "manifest.json"), "utf8")).toContain('"route": "/"');
    expect(result.value.contactSheets.some((s) => s.route === "/")).toBe(true);
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
    expect(result.ok).toBe(true);
    expect(result.value.ok).toBe(false);
    expect(result.value.cells.some((c) => (c.axeNew ?? []).length > 0)).toBe(true);
  });

  it("fails collection with no CSS and writes no pass verdict", async () => {
    const { result } = await runRoutes(["/bare"]);
    expect(result.ok).toBe(true);
    expect(result.value.ok).toBe(false);
    expect(result.value.collection).toBe("failed");
    expect(result.value.cells.every((c) => !cellHasVerdict(c))).toBe(true);
  });
});
