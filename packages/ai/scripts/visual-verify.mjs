#!/usr/bin/env node
// Original work by the same author.
/* global document, getComputedStyle, window -- page.evaluate browser scope */
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { err, ok, tryCatch, tryCatchAsync } from "@zedtech/zedkit-core";

export const WIDTHS = [375, 809, 1440];
export const MODES = ["light", "dark"];
export const VIEWPORT_HEIGHT = 900;
export const DEFAULT_LOOKS = ["mist", "press", "tide", "volt", "maison", "glass"];
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
export const PEER_HINT = "install `@playwright/test` and run `playwright install chromium`";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

export function relativeLuminance(rgb) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function copySitsWithBlock(button, frame) {
  const overlap =
    button.right >= frame.left &&
    button.left <= frame.right &&
    button.bottom >= frame.top &&
    button.top <= frame.bottom;
  if (overlap) return true;
  return (
    button.bottom <= frame.top + 48 &&
    button.right >= frame.left &&
    button.left <= frame.right
  );
}

export function looksGridTriggered(files) {
  return files.some((file) => {
    const n = file.replaceAll("\\", "/");
    if (/identities[^/]*\.css$/iu.test(n)) return true;
    if (/(?:^|\/)(?:tokens?|styles)\.(?:css|ts)$/iu.test(n)) return true;
    if (!/packages\/ui\/src\/.+\.tsx$/u.test(n)) return false;
    return !/\.(?:test|spec)\./u.test(n);
  });
}

export function slugNeed(heading) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

export function routesFromFiles(files, manifest) {
  const routes = new Set();
  const sources = [];
  if (manifest && typeof manifest === "object") {
    const rich = manifest.rich && typeof manifest.rich === "object" ? manifest.rich : manifest;
    for (const [need, entry] of Object.entries(rich)) {
      if (entry && typeof entry === "object" && typeof entry.source === "string") {
        sources.push({ source: entry.source.replaceAll("\\", "/"), route: `/docs/ui/${slugNeed(need)}` });
      }
    }
  }
  for (const file of files) {
    const n = file.replaceAll("\\", "/");
    const page = /\/app\/(.+)\/page\.(?:tsx|jsx|js)$/u.exec(`/${n}`);
    if (page) {
      const inner = page[1] ?? "";
      if (!inner.includes("[")) {
        const segs = inner.split("/").filter((s) => s && !s.startsWith("(") && !s.startsWith("@"));
        routes.add(`/${segs.join("/")}`);
      }
    }
    for (const row of sources) {
      if (n === row.source || n.endsWith(`/${row.source}`)) routes.add(row.route);
    }
  }
  return [...routes];
}

export function unionRoutes(changedRoutes, extra) {
  return [...new Set([...extra, ...changedRoutes].map((r) => (r.startsWith("/") ? r : `/${r}`)))];
}

export function resolveStaticFile(root, urlPath) {
  const base = resolve(root);
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const trimmed = decoded.replace(/\/$/u, "") || "/";
  const rel = trimmed === "/" ? "index.html" : trimmed.replace(/^\//u, "");
  const candidates = [rel, `${rel}.html`, join(rel, "index.html")];
  for (const candidate of candidates) {
    const full = resolve(base, candidate);
    if (full !== base && !full.startsWith(base + sep)) continue;
    if (existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
}

export function visualReferencePath(ticket) {
  const match = /Visual reference:\s*(\S+)/u.exec(ticket);
  return match?.[1] ?? null;
}

export function sanitizeBranch(name) {
  const cleaned = name.replace(/[^A-Za-z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "");
  return cleaned || "HEAD";
}

export function isAllowedRequest(url, origin) {
  const parsed = tryCatch(() => new URL(url));
  if (!parsed.ok) return true;
  if (parsed.value.protocol !== "http:" && parsed.value.protocol !== "https:") return true;
  if (parsed.value.hostname === "127.0.0.1" || parsed.value.hostname === "localhost") return true;
  return parsed.value.origin === origin;
}

export function newAxeIds(violations, baselineIds) {
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => v.id)
    .filter((id) => !baselineIds.has(id));
}

export function collectionFailedRecord(reason) {
  return { collection: "failed", reason };
}

export function cellHasVerdict(cell) {
  return cell.collection === "ok" && "overflow" in cell;
}

export function markdownTable(report) {
  const header = "| route | width | mode | look | collection | overflow | axe new | h1 | size | lines | share |";
  const sep = "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const rows = report.cells.map((cell) => {
    const overflow = cellHasVerdict(cell) ? (cell.overflow ? "fail" : "ok") : "—";
    const axe = cellHasVerdict(cell) ? (cell.axeNew.length ? cell.axeNew.join(",") : "0") : "—";
    const h1 = cell.h1?.count ?? "—";
    const size = cell.h1?.fontSize ?? "—";
    const lines = cell.h1?.lines ?? "—";
    const share = cell.h1?.share === undefined ? "—" : cell.h1.share.toFixed(2);
    return `| ${cell.route} | ${cell.width} | ${cell.mode} | ${cell.identity ?? "—"} | ${cell.collection} | ${overflow} | ${axe} | ${h1} | ${size} | ${lines} | ${share} |`;
  });
  return [header, sep, ...rows].join("\n");
}

export function baselineAxeIds(record) {
  const ids = new Set();
  if (!record || !Array.isArray(record.cells)) return ids;
  for (const cell of record.cells) {
    if (Array.isArray(cell.axeIds)) for (const id of cell.axeIds) ids.add(id);
    if (Array.isArray(cell.axeNew)) for (const id of cell.axeNew) ids.add(id);
  }
  return ids;
}

export function parseVisualVerifyArgs(args) {
  const parsed = tryCatch(() =>
    parseArgs({
      args,
      allowPositionals: false,
      options: {
        url: { type: "string" },
        dir: { type: "string" },
        changed: { type: "boolean" },
        base: { type: "string" },
        routes: { type: "string" },
        identities: { type: "string" },
        baseline: { type: "string" },
        out: { type: "string" },
        md: { type: "string" },
        ticket: { type: "string" },
        manifest: { type: "string" },
        help: { type: "boolean", short: "h" },
        cwd: { type: "string" },
      },
    }),
  );
  if (!parsed.ok) return err(parsed.error);
  const v = parsed.value.values;
  const split = (value) =>
    String(value ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return ok({
    url: v.url,
    dir: v.dir,
    changed: v.changed === true,
    base: v.base,
    routes: split(v.routes),
    identities: v.identities === undefined ? undefined : split(v.identities),
    baseline: v.baseline,
    out: v.out,
    md: v.md,
    ticket: v.ticket,
    manifest: v.manifest,
    help: v.help === true,
    cwd: v.cwd,
  });
}

export function usageVisualVerify() {
  return `zedkit-ai visual-verify [--url <origin> | --dir <static-export>]
      [--changed] [--base <ref>] [--routes <path,path>] [--identities <id,id>]
      [--baseline <run-record.json>] [--out <dir>] [--md <file>]
      [--ticket <file>] [--manifest <docs-manifest.json>]
      Render touched routes at 375, 809 and 1440 in light and dark.
      Writes a run record (evidence/<branch>/manifest.json), one contact
      sheet PNG per route, and a Markdown table. Collection failed (no CSS
      or fonts) exits 1 with no verdict. Overflow or a new serious axe
      violation exits 1. Missing Playwright/axe peers exit 2.`;
}

function git(cwd, gitArgs) {
  const run = spawnSync("git", gitArgs, { cwd, encoding: "utf8" });
  if (run.status !== 0) return err(new Error(run.stderr.trim() || `git ${gitArgs[0]} failed`));
  return ok((run.stdout ?? "").trim());
}

export function defaultGitBase(cwd) {
  for (const ref of ["origin/dev", "origin/main", "HEAD~1"]) {
    const probed = git(cwd, ["rev-parse", "--verify", ref]);
    if (probed.ok) return ref;
  }
  return "HEAD";
}

export function changedFiles(cwd, base) {
  const diff = git(cwd, ["diff", "--name-only", `${base}...HEAD`]);
  if (!diff.ok) return [];
  return diff.value.split("\n").filter(Boolean);
}

export function currentBranch(cwd) {
  const name = git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
  return sanitizeBranch(name.ok ? name.value : "HEAD");
}

function loadManifestFile(path) {
  if (!path) return undefined;
  const raw = tryCatch(() => JSON.parse(readFileSync(path, "utf8")));
  return raw.ok ? raw.value : undefined;
}

function serveDir(root) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const file = resolveStaticFile(root, url.pathname);
    if (!file) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.setHeader("content-type", MIME[extname(file)] ?? "application/octet-stream");
    createReadStream(file).pipe(res);
  });
  return new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolveListen({ server, origin: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function resolvePeer(spec) {
  const starts = [import.meta.url];
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    starts.push(pathToFileURL(join(dir, "package.json")).href);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const start of starts) {
    const found = tryCatch(() => createRequire(start).resolve(spec));
    if (found.ok) return found;
  }
  return err(new Error(PEER_HINT));
}

function importPeer(spec) {
  const resolved = resolvePeer(spec);
  if (!resolved.ok) return Promise.resolve(err(new Error(PEER_HINT)));
  return tryCatchAsync(() => import(pathToFileURL(resolved.value).href));
}

export async function loadPlaywright() {
  const loaded = await importPeer("@playwright/test");
  if (!loaded.ok) return err(new Error(PEER_HINT));
  return ok(loaded.value);
}

export async function loadAxe() {
  const loaded = await importPeer("@axe-core/playwright");
  if (!loaded.ok) return err(new Error(PEER_HINT));
  return ok(loaded.value.default ?? loaded.value);
}

const CONTRAST_WALK = (el) => {
  const parse = (css) => {
    const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/u);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };
  const isTransparent = (css) => css === "transparent" || css === "rgba(0, 0, 0, 0)";
  const fgRgb = parse(getComputedStyle(el).color);
  let bgRgb = null;
  for (let node = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (!isTransparent(bg)) {
      bgRgb = parse(bg);
      if (bgRgb) break;
    }
  }
  if (!fgRgb || !bgRgb) return 0;
  const lum = (rgb) => {
    const channel = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  };
  const l1 = lum(fgRgb);
  const l2 = lum(bgRgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

async function readCollection(page) {
  const fonts = await tryCatchAsync(() => page.evaluate(() => document.fonts.ready));
  if (!fonts.ok) return { ok: false, reason: "fonts" };
  return page.evaluate(() => {
    let rules = 0;
    for (const sheet of document.styleSheets) {
      const count = sheet.href
        ? 1
        : sheet.cssRules
          ? sheet.cssRules.length
          : 0;
      rules += count;
    }
    const token = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    const ok = rules > 0 || token.length > 0;
    return { ok, reason: ok ? "" : "css" };
  });
}

async function readPageFacts(page) {
  return page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    const h1s = [...document.querySelectorAll("h1")];
    const h1 = h1s[0];
    let h1Facts = { count: h1s.length, fontSize: 0, lines: 0, share: 0 };
    if (h1) {
      const cs = getComputedStyle(h1);
      const rect = h1.getBoundingClientRect();
      const size = Number.parseFloat(cs.fontSize) || 0;
      const lh = Number.parseFloat(cs.lineHeight) || size || 1;
      h1Facts = {
        count: h1s.length,
        fontSize: size,
        lines: Math.max(1, Math.round(rect.height / lh)),
        share: window.innerHeight ? rect.height / window.innerHeight : 0,
      };
    }
    const named = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim();
    const buttons = [...document.querySelectorAll("button, [role=button]")].filter((el) => named(el) === "Copy");
    const copy = buttons.map((button) => {
      const frame = button.closest("figure, pre, [data-code-frame]") ?? button.parentElement;
      const block = frame?.querySelector("pre, code") ?? frame;
      const br = button.getBoundingClientRect();
      const fr = (block ?? frame)?.getBoundingClientRect();
      return {
        button: { left: br.left, right: br.right, top: br.top, bottom: br.bottom },
        frame: fr ? { left: fr.left, right: fr.right, top: fr.top, bottom: fr.bottom } : null,
      };
    });
    return { overflow, h1: h1Facts, copy };
  });
}

async function selectedContrast(page) {
  const roles = ["[role=tab]", "[role=radio]"];
  let min = Infinity;
  let count = 0;
  for (const sel of roles) {
    const locators = await page.locator(sel).all();
    for (const loc of locators) {
      await tryCatchAsync(() => loc.click({ timeout: 2000 }));
      const ratio = await loc.evaluate(CONTRAST_WALK);
      count += 1;
      if (ratio < min) min = ratio;
    }
  }
  if (count === 0) return { fail: false, min: 0, count: 0 };
  return { fail: min < 4.5, min, count };
}

function cellFailed(cell) {
  if (cell.collection !== "ok") return true;
  if (cell.overflow) return true;
  if (cell.pageerror > 0 || cell.consoleErrors > 0 || cell.httpErrors > 0) return true;
  if (cell.axeNew.length > 0) return true;
  if (cell.selectedContrast?.fail) return true;
  if (cell.copyButtons?.fail) return true;
  if (cell.h1.count !== 1 || cell.h1.fontSize === 0) return true;
  return false;
}

async function stitchSheet(page, shots, dest, mockup) {
  const cells = shots.map((shot) => ({ src: `data:image/png;base64,${readFileSync(shot.path).toString("base64")}`, label: shot.label }));
  if (mockup && existsSync(mockup)) {
    cells.push({ src: `data:image/png;base64,${readFileSync(mockup).toString("base64")}`, label: "reference" });
  }
  const html = `<!doctype html><html><head><style>
    body{margin:0;background:#111;color:#eee;font:12px sans-serif}
    .g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}
    figure{margin:0} img{width:100%;height:auto;display:block}
  </style></head><body><div class="g">${cells
    .map((c) => `<figure><img src="${c.src}" alt="${c.label}"><figcaption>${c.label}</figcaption></figure>`)
    .join("")}</div></body></html>`;
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: dest, fullPage: true });
}

export async function runVisualVerify(options, deps = {}) {
  const cwd = options.cwd ?? process.cwd();
  const loadPw = deps.loadPlaywright ?? loadPlaywright;
  const loadAxeBuilder = deps.loadAxe ?? loadAxe;
  const playwright = await loadPw();
  if (!playwright.ok) return err(playwright.error);
  const axeMod = await loadAxeBuilder();
  if (!axeMod.ok) return err(axeMod.error);
  const AxeBuilder = axeMod.value;
  const { chromium } = playwright.value;

  const branch = currentBranch(cwd);
  const outDir = resolve(cwd, options.out ?? join("evidence", branch));
  mkdirSync(outDir, { recursive: true });

  const files = options.changed ? changedFiles(cwd, options.base ?? defaultGitBase(cwd)) : [];
  const manifest = loadManifestFile(options.manifest ? resolve(cwd, options.manifest) : "");
  const fromDiff = routesFromFiles(files, manifest);
  const routes = unionRoutes(fromDiff, options.routes ?? []);
  if (routes.length === 0) return err(new Error("no routes: pass --routes or --changed"));

  const looksOn = options.identities !== undefined || looksGridTriggered(files);
  const identities = looksOn ? (options.identities ?? DEFAULT_LOOKS) : [undefined];

  let baselineIds = new Set();
  if (options.baseline && existsSync(resolve(cwd, options.baseline))) {
    const raw = tryCatch(() => JSON.parse(readFileSync(resolve(cwd, options.baseline), "utf8")));
    if (raw.ok) baselineIds = baselineAxeIds(raw.value);
  }

  let ticketText = "";
  if (options.ticket && existsSync(resolve(cwd, options.ticket))) {
    ticketText = readFileSync(resolve(cwd, options.ticket), "utf8");
  }
  const mockupRel = visualReferencePath(ticketText);
  const mockup = mockupRel && existsSync(resolve(cwd, mockupRel)) ? resolve(cwd, mockupRel) : null;

  let origin = options.url;
  let server = null;
  if (!origin) {
    if (!options.dir) return err(new Error("pass --url or --dir"));
    const served = await serveDir(resolve(cwd, options.dir));
    server = served.server;
    origin = served.origin;
  }
  origin = origin.replace(/\/$/u, "");

  const browserResult = await tryCatchAsync(() => chromium.launch());
  if (!browserResult.ok) {
    server?.close();
    return err(new Error(`${PEER_HINT} (${browserResult.error.message})`));
  }
  const browser = browserResult.value;
  const contextResult = await tryCatchAsync(() => browser.newContext());
  if (!contextResult.ok) {
    await browser.close();
    server?.close();
    return err(contextResult.error);
  }
  const context = contextResult.value;
  const cells = [];
  const contactSheets = [];
  const run = await tryCatchAsync(async () => {
    for (const route of routes) {
      const shots = [];
      for (const width of WIDTHS) {
        for (const mode of MODES) {
          for (const identity of identities) {
            const page = await context.newPage();
            await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
            const pageerrors = [];
            const consoles = [];
            const httpErrors = [];
            page.on("pageerror", (error) => pageerrors.push(error?.message ?? String(error)));
            page.on("console", (msg) => {
              if (msg.type() === "error") consoles.push(msg.text());
            });
            page.on("response", (res) => {
              if (res.status() >= 400) httpErrors.push(res.status());
            });
            await page.route("**/*", (routeReq) => {
              if (isAllowedRequest(routeReq.request().url(), origin)) return routeReq.continue();
              return routeReq.abort();
            });
            await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
            const target = `${origin}${route === "/" ? "/" : route}`;
            await page.goto(target, { waitUntil: "domcontentloaded" });
            await page.evaluate(
              ({ nextMode, nextIdentity }) => {
                document.documentElement.classList.toggle("dark", nextMode === "dark");
                document.documentElement.style.colorScheme = nextMode;
                if (nextIdentity) document.documentElement.setAttribute("data-identity", nextIdentity);
              },
              { nextMode: mode, nextIdentity: identity },
            );
            const collection = await readCollection(page);
            const stem = [route.replaceAll("/", "_") || "home", width, mode, identity ?? "default"].join("-");
            const shotPath = join(outDir, `${stem}.png`);
            if (!collection.ok) {
              cells.push({
                route,
                width,
                mode,
                identity,
                collection: "failed",
                reason: collection.reason,
                pageerror: pageerrors.length,
                pageerrors,
                consoleErrors: consoles.length,
                httpErrors: httpErrors.length,
                screenshot: shotPath,
              });
              await page.close();
              continue;
            }
            const facts = await readPageFacts(page);
            const selected = await selectedContrast(page);
            let axeNew = [];
            let axeIds = [];
            const axeRun = await tryCatchAsync(async () => {
              const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
              return builder.analyze();
            });
            if (axeRun.ok) {
              const serious = (axeRun.value.violations ?? []).filter(
                (v) => v.impact === "serious" || v.impact === "critical",
              );
              axeIds = serious.map((v) => v.id);
              axeNew = newAxeIds(serious, baselineIds);
            } else {
              pageerrors.push(`axe: ${axeRun.error.message}`);
            }
            const copyFail = facts.copy.some((pair) => !pair.frame || !copySitsWithBlock(pair.button, pair.frame));
            await page.screenshot({ path: shotPath, fullPage: false });
            shots.push({ path: shotPath, label: `${width} ${mode}${identity ? ` ${identity}` : ""}` });
            cells.push({
              route,
              width,
              mode,
              identity,
              collection: "ok",
              overflow: facts.overflow,
              pageerror: pageerrors.length,
              pageerrors,
              consoleErrors: consoles.length,
              httpErrors: httpErrors.length,
              axeNew,
              axeIds,
              selectedContrast: selected,
              copyButtons: { fail: copyFail, count: facts.copy.length },
              h1: facts.h1,
              screenshot: shotPath,
            });
            await page.close();
          }
        }
      }
      const sheetPath = join(outDir, `sheet-${route.replaceAll("/", "_") || "home"}.png`);
      const sheetPage = await context.newPage();
      await sheetPage.setViewportSize({ width: 1200, height: 800 });
      await stitchSheet(sheetPage, shots, sheetPath, mockup);
      await sheetPage.close();
      contactSheets.push({ route, path: sheetPath });
    }
  });
  await context.close();
  await browser.close();
  server?.close();
  if (!run.ok) return err(run.error);

  const anyCollectionFailed = cells.some((c) => c.collection !== "ok");
  const okRun = cells.length > 0 && cells.every((c) => !cellFailed(c));
  const report = {
    branch,
    collection: anyCollectionFailed ? "failed" : "ok",
    looksGrid: looksOn,
    identities: identities.filter(Boolean),
    routes,
    cells,
    contactSheets,
    ok: okRun,
  };
  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`);
  return ok(report);
}

export async function visualVerifyMain(args, sinks, deps) {
  const parsed = parseVisualVerifyArgs(args);
  if (!parsed.ok) {
    sinks.err(`error: ${parsed.error.message}`);
    sinks.err(usageVisualVerify());
    return 2;
  }
  if (parsed.value.help) {
    sinks.out(usageVisualVerify());
    return 0;
  }
  if (!parsed.value.url && !parsed.value.dir) {
    sinks.err("error: pass --url or --dir");
    sinks.err(usageVisualVerify());
    return 2;
  }
  const result = await runVisualVerify(parsed.value, deps);
  if (!result.ok) {
    const message = result.error.message;
    sinks.err(`error: ${message}`);
    return message.includes("install") ? 2 : 1;
  }
  const table = markdownTable(result.value);
  sinks.out(table);
  if (parsed.value.md) {
    const mdPath = resolve(parsed.value.cwd ?? process.cwd(), parsed.value.md);
    mkdirSync(dirname(mdPath), { recursive: true });
    writeFileSync(mdPath, `${table}\n`);
  }
  return result.value.ok ? 0 : 1;
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const code = await visualVerifyMain(process.argv.slice(2), {
    out: (line) => console.log(line),
    err: (line) => console.error(line),
  });
  process.exitCode = code;
}
