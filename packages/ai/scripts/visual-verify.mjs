#!/usr/bin/env node
// Original work by the same author.
/* global document, getComputedStyle, window -- page.evaluate browser scope */
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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
export const PEER_MISSING = "PEER_MISSING";
export const BAD_FLAG = "BAD_FLAG";
export const HIT_TARGET_MIN = 24;
export const HIT_FAIL_CAP = 5;
export const MAX_FLAG_BYTES = 1024 * 1024;
export const MAX_PNG_BYTES = 8 * 1024 * 1024;
export const MAX_DIR_ENTRIES = 256;
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

export function peerHint(spec) {
  if (spec === "@axe-core/playwright") return "install `@axe-core/playwright`";
  return PEER_HINT;
}

export function peerMissingError(spec, extra = "") {
  const error = new Error(extra ? `${peerHint(spec)} (${extra})` : peerHint(spec));
  error.code = PEER_MISSING;
  return error;
}

export function unwrapPeerModule(mod, key) {
  if (key && mod?.[key] != null) return mod;
  return mod?.default ?? mod;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function mdCell(value) {
  const text = String(value ?? "").replaceAll(/[|\r\n]+/gu, " ").trim();
  return text || "—";
}

export function pngDataUri(path) {
  const st = tryCatch(() => statSync(path));
  if (!st.ok || !st.value.isFile() || st.value.size > MAX_PNG_BYTES) return "";
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

function uniqueName(used, base) {
  let name = base;
  let n = 2;
  while (used.has(name)) {
    name = `${base}-${n}`;
    n += 1;
  }
  used.add(name);
  return name;
}

export function isFaviconRequest(url) {
  const parsed = tryCatch(() => new URL(url));
  const path = parsed.ok ? parsed.value.pathname : String(url);
  return /favicon/iu.test(path);
}

export function routeStem(route) {
  return String(route).replaceAll(/[/\\:]+/gu, "_").replace(/^_+|_+$/gu, "") || "home";
}

export function isSafeGitRef(ref) {
  return typeof ref === "string" && ref.length > 0 && !ref.startsWith("-");
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
    button.bottom >= frame.top - 48 &&
    button.right >= frame.left &&
    button.left <= frame.right
  );
}

export function identitiesFromChangedFiles(files) {
  let full = false;
  const touched = [];
  for (const file of files) {
    const n = file.replaceAll("\\", "/");
    const look = /(?:^|\/)identities\/([^/]+)\.css$/iu.exec(n);
    if (look) {
      const id = look[1].toLowerCase();
      if (!touched.includes(id)) touched.push(id);
      continue;
    }
    if (/identities[^/]*\.css$/iu.test(n)) {
      full = true;
      continue;
    }
    if (/(?:^|\/)(?:tokens?|styles)\.(?:css|ts)$/iu.test(n)) {
      full = true;
      continue;
    }
    if (!/packages\/ui\/src\/.+\.tsx$/u.test(n)) continue;
    if (/\.(?:test|spec)\./u.test(n)) continue;
    full = true;
  }
  if (full) return [...DEFAULT_LOOKS];
  return touched;
}

/** CI six-look trigger. Lockstep with scripts/docs-render-routes.mjs; evidence looks use identitiesFromChangedFiles. */
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
    if (
      /(?:^|\/)apps\/docs\/features\/reviews\//u.test(n) ||
      /(?:^|\/)apps\/docs\/app\/\(run-console\)\//u.test(n) ||
      /(?:^|\/)apps\/docs\/app\/\([^/]+\)\/issues\//u.test(n)
    ) {
      routes.add("/issues");
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
  const decoded = tryCatch(() => decodeURIComponent((urlPath ?? "/").split("?")[0] ?? "/"));
  if (!decoded.ok) return null;
  const trimmed = decoded.value.replace(/\/$/u, "") || "/";
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

export function ticketStateNames(ticket) {
  const match = /^\*{0,2}States:\*{0,2}\s*(.+)$/mu.exec(ticket);
  if (!match) return { skip: false, unverified: [] };
  const line = match[1].trim();
  if (/^no transient states$/iu.test(line)) return { skip: true, unverified: [] };
  return { skip: false, unverified: line.split(",").map((s) => s.trim()).filter(Boolean) };
}

function flagError(message) {
  const error = new Error(message);
  error.code = BAD_FLAG;
  return error;
}

export function parseStatesFile(raw) {
  const parsed = tryCatch(() => JSON.parse(raw));
  if (!parsed.ok) return err(flagError(`invalid --states: ${parsed.error.message}`));
  if (!Array.isArray(parsed.value)) return err(flagError("invalid --states: must be a JSON array"));
  const states = [];
  for (const row of parsed.value) {
    if (!row || typeof row !== "object" || typeof row.name !== "string" || !row.name.trim()) {
      return err(flagError("invalid --states: entries need a name"));
    }
    if ("click" in row && row.click != null && typeof row.click !== "string") {
      return err(flagError("invalid --states: click must be a string"));
    }
    const click = typeof row.click === "string" && row.click.trim() ? row.click.trim() : undefined;
    states.push(click ? { name: row.name.trim(), click } : { name: row.name.trim() });
  }
  return ok(states);
}

function loadStatesOption(cwd, statesPath) {
  if (!statesPath) return ok([]);
  const full = resolve(cwd, statesPath);
  const st = tryCatch(() => statSync(full));
  if (!st.ok || !st.value.isFile()) return err(flagError(`missing --states: ${statesPath}`));
  if (st.value.size > MAX_FLAG_BYTES) return err(flagError("invalid --states: file too large"));
  const raw = tryCatch(() => readFileSync(full, "utf8"));
  if (!raw.ok) return err(flagError(`unreadable --states: ${statesPath}`));
  return parseStatesFile(raw.value);
}

function loadMockupOption(cwd, mockupPath) {
  if (!mockupPath) return ok(null);
  const full = resolve(cwd, mockupPath);
  if (!existsSync(full)) return err(flagError(`missing --mockup: ${mockupPath}`));
  return ok(full);
}

export function resolveMockupForWidth(spec, route, width, cwd) {
  if (!spec) return null;
  const root = resolve(cwd ?? ".", spec);
  if (!existsSync(root)) return null;
  if (statSync(root).isFile()) return root;
  const named = join(root, `${routeStem(route)}-${width}.png`);
  if (existsSync(named) && statSync(named).isFile()) return named;
  const byWidth = join(root, `${width}.png`);
  if (existsSync(byWidth) && statSync(byWidth).isFile()) return byWidth;
  const listing = tryCatch(() => readdirSync(root));
  if (!listing.ok || listing.value.length > MAX_DIR_ENTRIES) return null;
  const pngs = listing.value.filter((name) => name.toLowerCase().endsWith(".png"));
  if (pngs.length !== 1) return null;
  const only = join(root, pngs[0]);
  return statSync(only).isFile() ? only : null;
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

function hitLabel(cell) {
  if (!cellHasVerdict(cell)) return "—";
  if (!cell.hitTargets?.fail) return "ok";
  const first = cell.hitTargets.failed?.[0];
  if (!first) return "fail";
  const role = first.role ? `[${first.role}]` : "";
  const box = first.box ? ` ${first.box.w}×${first.box.h}` : "";
  return `fail ${first.tag}${role}${box}`;
}

export function markdownTable(report) {
  const header =
    "| route | width | mode | look | state | collection | overflow | hit | new serious axe | h1 | h1 size | lines | h1 share of viewport |";
  const sep = "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const rows = report.cells.map((cell) => {
    const overflow = cellHasVerdict(cell) ? (cell.overflow ? "fail" : "ok") : "—";
    const axe = cellHasVerdict(cell) ? (cell.axeNew.length ? cell.axeNew.join(",") : "0") : "—";
    const h1 = cell.h1?.count ?? "—";
    const size = cell.h1?.fontSize ?? "—";
    const lines = cell.h1?.lines ?? "—";
    const share = cell.h1?.share === undefined ? "—" : cell.h1.share.toFixed(2);
    return `| ${mdCell(cell.route)} | ${mdCell(cell.width)} | ${mdCell(cell.mode)} | ${mdCell(cell.identity ?? "—")} | ${mdCell(cell.state ?? "—")} | ${mdCell(cell.collection)} | ${mdCell(overflow)} | ${mdCell(hitLabel(cell))} | ${mdCell(axe)} | ${mdCell(h1)} | ${mdCell(size)} | ${mdCell(lines)} | ${mdCell(share)} |`;
  });
  return [header, sep, ...rows].join("\n");
}

export function formatReportText(report, recordPath) {
  const lines = [markdownTable(report)];
  if (report.statesUnverified?.length) {
    lines.push(`statesUnverified: ${report.statesUnverified.map((n) => mdCell(n)).join(", ")}`);
  }
  lines.push(report.ok ? "pass" : "fail", recordPath);
  return `${lines.join("\n")}\n`;
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
        "base-url": { type: "string" },
        dir: { type: "string" },
        changed: { type: "boolean" },
        base: { type: "string" },
        routes: { type: "string" },
        widths: { type: "string" },
        modes: { type: "string" },
        identities: { type: "string" },
        baseline: { type: "string" },
        out: { type: "string" },
        md: { type: "string" },
        ticket: { type: "string" },
        states: { type: "string" },
        mockup: { type: "string" },
        manifest: { type: "string" },
        help: { type: "boolean", short: "h" },
        cwd: { type: "string" },
      },
    }),
  );
  if (!parsed.ok) return err(parsed.error);
  const v = parsed.value.values;
  if (v.url && v["base-url"]) return err(new Error("pass only one of --url and --base-url"));
  const split = (value) =>
    String(value ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const routeTokens = split(v.routes);
  const auto = routeTokens.includes("auto");
  const widths = split(v.widths).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const modes = split(v.modes);
  return ok({
    url: v.url ?? v["base-url"],
    dir: v.dir,
    changed: v.changed === true || auto,
    base: v.base,
    routes: routeTokens.filter((r) => r !== "auto"),
    widths: widths.length > 0 ? widths : WIDTHS,
    modes: modes.length > 0 ? modes : MODES,
    identities: v.identities === undefined ? undefined : split(v.identities),
    baseline: v.baseline,
    out: v.out,
    md: v.md,
    ticket: v.ticket,
    states: v.states,
    mockup: v.mockup,
    manifest: v.manifest,
    help: v.help === true,
    cwd: v.cwd,
  });
}

export function usageVisualVerify(command = "visual-verify") {
  const name = command === "evidence" ? "evidence" : "visual-verify";
  const fallback = `zedkit-ai ${name} [--url <origin> | --dir <static-export>]`;
  const read = tryCatch(() => readFileSync(new URL("../kit/usage.txt", import.meta.url), "utf8"));
  if (!read.ok) return fallback;
  const block = new RegExp(`(?:^|\\n) {2}(${name} [\\s\\S]*?)(?=\\n {2}[a-z-]|$)`, "u").exec(read.value)?.[1]?.trim();
  return block ? `zedkit-ai ${block}` : fallback;
}

function git(cwd, gitArgs) {
  const run = spawnSync("git", gitArgs, { cwd, encoding: "utf8" });
  if (run.status !== 0) return err(new Error((run.stderr ?? "").trim() || `git ${gitArgs[0]} failed`));
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
  if (!isSafeGitRef(base)) return [];
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
    const url = tryCatch(() => new URL(req.url ?? "/", "http://127.0.0.1"));
    if (!url.ok) {
      res.writeHead(400);
      res.end("bad request");
      return;
    }
    const file = resolveStaticFile(root, url.value.pathname);
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
  const starts = [import.meta.url, pathToFileURL(join(process.cwd(), "package.json")).href];
  for (const start of starts) {
    const found = tryCatch(() => createRequire(start).resolve(spec));
    if (found.ok) return found;
  }
  return err(peerMissingError(spec));
}

async function importPeer(spec, load) {
  const resolved = resolvePeer(spec);
  if (!resolved.ok) return err(resolved.error);
  const loaded = await tryCatchAsync(load);
  if (loaded.ok) return loaded;
  return tryCatchAsync(() => import(pathToFileURL(resolved.value).href));
}

export async function loadPlaywright() {
  const loaded = await importPeer("@playwright/test", () => import("@playwright/test"));
  if (!loaded.ok) return err(loaded.error);
  return ok(unwrapPeerModule(loaded.value, "chromium"));
}

export async function loadAxe() {
  const loaded = await importPeer("@axe-core/playwright", () => import("@axe-core/playwright"));
  if (!loaded.ok) return err(loaded.error);
  return ok(unwrapPeerModule(loaded.value));
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
  return page.evaluate(({ minTarget, failCap }) => {
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
    const clippedNodes = [];
    for (const el of document.body.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const ox = cs.overflowX;
      const oy = cs.overflowY;
      if (ox === "auto" || ox === "scroll" || oy === "auto" || oy === "scroll") continue;
      const xOver = el.scrollWidth > el.clientWidth + 1;
      const yOver = el.scrollHeight > el.clientHeight + 1;
      const hiddenX = ox === "hidden" || ox === "clip";
      const hiddenY = oy === "hidden" || oy === "clip";
      if ((hiddenX && xOver) || (hiddenY && yOver) || (cs.textOverflow === "ellipsis" && (xOver || yOver))) {
        clippedNodes.push(el);
      }
    }
    const hitSelector =
      "a, button, input, select, textarea, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=radio], [role=switch], [role=combobox]";
    let hitMin = Infinity;
    let hitCount = 0;
    let hitFail = false;
    const failed = [];
    const overlaps = (a, b) => a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
    for (const el of document.querySelectorAll(hitSelector)) {
      const cs = getComputedStyle(el);
      if (cs.display === "inline" || cs.display === "none" || cs.visibility === "hidden") continue;
      if (cs.pointerEvents === "none") continue;
      if (el.disabled || el.hasAttribute("disabled")) continue;
      const rect = el.getBoundingClientRect();
      let box = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      for (const pseudo of ["::before", "::after"]) {
        const p = getComputedStyle(el, pseudo);
        const pw = Number.parseFloat(p.width);
        const ph = Number.parseFloat(p.height);
        const pl = Number.parseFloat(p.left);
        const pt = Number.parseFloat(p.top);
        if (!Number.isFinite(pw) || !Number.isFinite(ph) || (pw <= 0 && ph <= 0)) continue;
        if (!Number.isFinite(pl) || !Number.isFinite(pt)) continue;
        const pbox = {
          left: rect.left + pl,
          top: rect.top + pt,
          right: rect.left + pl + pw,
          bottom: rect.top + pt + ph,
        };
        if (!overlaps(box, pbox)) continue;
        box = {
          left: Math.min(box.left, pbox.left),
          top: Math.min(box.top, pbox.top),
          right: Math.max(box.right, pbox.right),
          bottom: Math.max(box.bottom, pbox.bottom),
        };
      }
      const width = box.right - box.left;
      const height = box.bottom - box.top;
      const side = Math.min(width, height);
      if (!Number.isFinite(side) || side <= 0) continue;
      hitCount += 1;
      if (side < hitMin) hitMin = side;
      if (side < minTarget) {
        hitFail = true;
        if (failed.length < failCap) {
          failed.push({
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute("role") || undefined,
            box: { w: Math.round(width), h: Math.round(height) },
          });
        }
      }
    }
    return {
      overflow,
      h1: h1Facts,
      copy,
      clipped: clippedNodes.length > 0,
      clippedCount: clippedNodes.length,
      hitTargets: { fail: hitFail, count: hitCount, min: hitCount === 0 ? null : hitMin, failed },
    };
  }, { minTarget: HIT_TARGET_MIN, failCap: HIT_FAIL_CAP });
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
  if (cell.clipped) return true;
  if (cell.pageerror > 0 || cell.consoleErrors > 0 || cell.httpErrors > 0) return true;
  if (cell.axeNew.length > 0) return true;
  if (cell.selectedContrast?.fail) return true;
  if (cell.copyButtons?.fail) return true;
  if (cell.hitTargets?.fail) return true;
  if (cell.h1.count !== 1 || cell.h1.fontSize === 0) return true;
  return false;
}

async function screenshotHtml(page, html, dest) {
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: dest, fullPage: true });
}

async function stitchSheet(page, shots, dest, mockup) {
  const cells = shots.map((shot) => ({ src: pngDataUri(shot.path), label: shot.label })).filter((c) => c.src);
  const mockSrc = mockup && existsSync(mockup) ? pngDataUri(mockup) : "";
  if (mockSrc) cells.push({ src: mockSrc, label: "reference" });
  const html = `<!doctype html><html lang="en"><head><title>Contact sheet</title><style>
    body{margin:0;background:#111;color:#eee;font:12px sans-serif}
    .g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}
    figure{margin:0} img{width:100%;height:auto;display:block}
  </style></head><body><div class="g">${cells
    .map((c) => `<figure><img src="${c.src}" alt=""><figcaption>${escapeHtml(c.label)}</figcaption></figure>`)
    .join("")}</div></body></html>`;
  await screenshotHtml(page, html, dest);
}

async function stitchPair(page, columns, dest) {
  const head = columns.map((col) => {
    const look = col.look ? ` ${col.look}` : "";
    return `<th>${escapeHtml(`${col.width} ${col.mode}${look}`)}</th>`;
  }).join("");
  const pageRow = columns
    .map((col) => `<td><img src="${col.pageSrc}" alt=""></td>`)
    .join("");
  const mockRow = columns
    .map((col) => `<td>${col.mockupSrc ? `<img src="${col.mockupSrc}" alt="">` : "<p>no mockup</p>"}</td>`)
    .join("");
  const html = `<!doctype html><html lang="en"><head><title>Pair</title><style>
    body{margin:0;background:#111;color:#eee;font:12px sans-serif}
    table{border-collapse:collapse;width:100%}
    th,td{padding:8px;vertical-align:top;text-align:left}
    img{width:100%;height:auto;display:block}
  </style></head><body><table>
    <thead><tr><th></th>${head}</tr></thead>
    <tbody>
      <tr><th>page</th>${pageRow}</tr>
      <tr><th>mockup</th>${mockRow}</tr>
    </tbody>
  </table></body></html>`;
  await screenshotHtml(page, html, dest);
}

function failedCell(route, width, mode, identity, reason, extras = {}) {
  return { route, width, mode, identity, ...collectionFailedRecord(reason), ...extras };
}

async function runOneCell({ context, origin, route, width, mode, identity, outDir, AxeBuilder, baselineIds, state, usedShots }) {
  const pageResult = await tryCatchAsync(() => context.newPage());
  if (!pageResult.ok) {
    return { cell: failedCell(route, width, mode, identity, pageResult.error.message, state?.name ? { state: state.name } : {}), shot: null };
  }
  const page = pageResult.value;
  const measured = await tryCatchAsync(async () => {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
    const pageerrors = [];
    const consoles = [];
    const httpErrors = [];
    page.on("pageerror", (error) => pageerrors.push(error?.message ?? String(error)));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoles.push(msg.text());
    });
    page.on("response", (res) => {
      if (res.status() >= 400 && !isFaviconRequest(res.url())) httpErrors.push(res.status());
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
    if (state?.click) {
      const clicked = await tryCatchAsync(() => page.locator(state.click).click({ timeout: 2000 }));
      if (!clicked.ok) {
        return {
          cell: failedCell(route, width, mode, identity, `state:${state.name}`, {
            pageerror: pageerrors.length,
            pageerrors,
            consoleErrors: consoles.length,
            httpErrors: httpErrors.length,
            state: state.name,
          }),
          shot: null,
        };
      }
    }
    const extras = {
      pageerror: pageerrors.length,
      pageerrors,
      consoleErrors: consoles.length,
      httpErrors: httpErrors.length,
      ...(state?.name ? { state: state.name } : {}),
    };
    const collection = await readCollection(page);
    if (!collection.ok) {
      return { cell: failedCell(route, width, mode, identity, collection.reason, extras), shot: null };
    }
    const facts = await readPageFacts(page);
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
      extras.pageerror = pageerrors.length;
    }
    const shotParts = [routeStem(route), width, mode, identity ?? "default"];
    if (state?.name) shotParts.push(routeStem(state.name.replaceAll(/\s+/gu, "-")));
    const shotPath = join(outDir, `${uniqueName(usedShots ?? new Set(), shotParts.join("-"))}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    const selected = await selectedContrast(page);
    const copyFail = facts.copy.some((pair) => !pair.frame || !copySitsWithBlock(pair.button, pair.frame));
    const label = `${width} ${mode}${identity ? ` ${identity}` : ""}${state?.name ? ` ${state.name}` : ""}`;
    return {
      cell: {
        route,
        width,
        mode,
        identity,
        collection: "ok",
        overflow: facts.overflow,
        clipped: facts.clipped,
        clippedCount: facts.clippedCount,
        hitTargets: facts.hitTargets,
        ...extras,
        axeNew,
        axeIds,
        selectedContrast: selected,
        copyButtons: { fail: copyFail, count: facts.copy.length },
        h1: facts.h1,
        screenshot: shotPath,
      },
      shot: { path: shotPath, label },
    };
  });
  await tryCatchAsync(() => page.close());
  if (!measured.ok) {
    return { cell: failedCell(route, width, mode, identity, measured.error.message, state?.name ? { state: state.name } : {}), shot: null };
  }
  return measured.value;
}

export async function runVisualVerify(options, deps = {}) {
  const cwd = options.cwd ?? process.cwd();
  const statesLoaded = loadStatesOption(cwd, options.states);
  if (!statesLoaded.ok) return err(statesLoaded.error);
  const mockupLoaded = loadMockupOption(cwd, options.mockup);
  if (!mockupLoaded.ok) return err(mockupLoaded.error);
  let ticketText = "";
  if (options.ticket && existsSync(resolve(cwd, options.ticket))) {
    ticketText = readFileSync(resolve(cwd, options.ticket), "utf8");
  }
  const ticketStates = ticketStateNames(ticketText);
  const states = options.states ? statesLoaded.value : [];
  const statesTicket = ticketStates.skip ? [] : ticketStates.unverified;
  const captured = new Set(states.map((s) => s.name));
  const statesUnverified = ticketStates.skip
    ? []
    : options.states
      ? statesTicket.filter((name) => !captured.has(name))
      : statesTicket;
  const warnings = [];
  if (options.states && statesUnverified.length > 0) {
    warnings.push(`--states does not cover ticket States: ${statesUnverified.join(", ")}`);
  }
  let mockupRoot = mockupLoaded.value;
  if (!mockupRoot) {
    const rel = visualReferencePath(ticketText);
    if (rel && existsSync(resolve(cwd, rel))) mockupRoot = resolve(cwd, rel);
  }
  const loadPw = deps.loadPlaywright ?? loadPlaywright;
  const loadAxeBuilder = deps.loadAxe ?? loadAxe;
  const playwright = await loadPw();
  if (!playwright.ok) return err(playwright.error);
  const axeMod = await loadAxeBuilder();
  if (!axeMod.ok) return err(axeMod.error);
  const AxeBuilder = axeMod.value;
  const chromium = playwright.value?.chromium;
  if (!chromium) return err(peerMissingError("@playwright/test"));

  const branch = currentBranch(cwd);
  const outDir = resolve(cwd, options.out ?? join("evidence", branch));

  const files = options.changed ? changedFiles(cwd, options.base ?? defaultGitBase(cwd)) : [];
  const manifest = loadManifestFile(options.manifest ? resolve(cwd, options.manifest) : "");
  const fromDiff = routesFromFiles(files, manifest);
  const routes = unionRoutes(fromDiff, options.routes ?? []);
  if (routes.length === 0) return err(new Error("no routes: pass --routes or --changed"));

  const fileLooks = identitiesFromChangedFiles(files);
  const looksOn = options.identities !== undefined || fileLooks.length > 0;
  const identities = looksOn ? (options.identities ?? (fileLooks.length > 0 ? fileLooks : DEFAULT_LOOKS)) : [undefined];
  if (looksOn && identities.length === 0) return err(new Error("no identities: pass --identities <id,id>"));

  let baselineIds = new Set();
  if (options.baseline) {
    const baselinePath = resolve(cwd, options.baseline);
    if (existsSync(baselinePath)) {
      const raw = tryCatch(() => JSON.parse(readFileSync(baselinePath, "utf8")));
      if (!raw.ok) return err(new Error(`unreadable baseline: ${options.baseline}`));
      baselineIds = baselineAxeIds(raw.value);
    }
  }

  const widths = options.widths ?? WIDTHS;
  const modes = options.modes ?? MODES;

  let origin = options.url;
  let server = null;
  if (!origin) {
    if (!options.dir) return err(new Error("pass --url, --base-url, or --dir"));
    const served = await serveDir(resolve(cwd, options.dir));
    server = served.server;
    origin = served.origin;
  }
  origin = origin.replace(/\/$/u, "");
  mkdirSync(outDir, { recursive: true });

  const browserResult = await tryCatchAsync(() => chromium.launch());
  if (!browserResult.ok) {
    server?.close();
    return err(peerMissingError("@playwright/test", browserResult.error.message));
  }
  const browser = browserResult.value;
  const contextResult = await tryCatchAsync(() => browser.newContext());
  if (!contextResult.ok) {
    await tryCatchAsync(() => browser.close());
    server?.close();
    return err(contextResult.error);
  }
  const context = contextResult.value;
  const cells = [];
  const contactSheets = [];
  const pairs = [];
  const usedShots = new Set();
  const pairMode = modes[0];
  const pairLook = identities[0];
  const run = await tryCatchAsync(async () => {
    for (const route of routes) {
      const shots = [];
      const pairPageByWidth = new Map();
      for (const width of widths) {
        for (const mode of modes) {
          for (const identity of identities) {
            const one = await runOneCell({
              context,
              origin,
              route,
              width,
              mode,
              identity,
              outDir,
              AxeBuilder,
              baselineIds,
              usedShots,
            });
            cells.push(one.cell);
            if (one.shot) {
              shots.push(one.shot);
              if (mode === pairMode && identity === pairLook) pairPageByWidth.set(width, one.shot.path);
            }
            for (const state of states) {
              const extra = await runOneCell({
                context,
                origin,
                route,
                width,
                mode,
                identity,
                outDir,
                AxeBuilder,
                baselineIds,
                state,
                usedShots,
              });
              cells.push(extra.cell);
              if (extra.shot) shots.push(extra.shot);
            }
          }
        }
      }
      const sheetMockup = mockupRoot
        ? widths.map((w) => resolveMockupForWidth(mockupRoot, route, w, cwd)).find(Boolean) ?? null
        : null;
      const sheetPath = join(outDir, `sheet-${routeStem(route)}.png`);
      const sheet = await tryCatchAsync(async () => {
        const sheetPage = await context.newPage();
        await sheetPage.setViewportSize({ width: 1200, height: 800 });
        await stitchSheet(sheetPage, shots, sheetPath, sheetMockup);
        await sheetPage.close();
        return { route, path: sheetPath };
      });
      if (sheet.ok) contactSheets.push(sheet.value);
      if (mockupRoot) {
        const columns = [];
        for (const width of widths) {
          const pagePath = pairPageByWidth.get(width);
          if (!pagePath || !existsSync(pagePath)) continue;
          const mockPath = resolveMockupForWidth(mockupRoot, route, width, cwd);
          const mockSrc = mockPath && existsSync(mockPath) ? pngDataUri(mockPath) : "";
          const pageSrc = pngDataUri(pagePath);
          if (!pageSrc) continue;
          columns.push({
            width,
            mode: pairMode,
            look: pairLook ?? "",
            pageSrc,
            mockupSrc: mockSrc,
          });
        }
        if (columns.some((col) => col.mockupSrc) && columns.length > 0) {
          const pairPath = join(outDir, `pair-${routeStem(route)}.png`);
          const pair = await tryCatchAsync(async () => {
            const pairPage = await context.newPage();
            await pairPage.setViewportSize({ width: 1200, height: 800 });
            await stitchPair(pairPage, columns, pairPath);
            await pairPage.close();
            return { route, path: pairPath };
          });
          if (pair.ok) pairs.push(pair.value);
        } else if (options.mockup) {
          warnings.push(`unresolvable --mockup for ${route}: no matching PNG`);
        }
      }
    }
  });
  await tryCatchAsync(() => context.close());
  await tryCatchAsync(() => browser.close());
  server?.close();
  if (!run.ok) return err(run.error);
  if (cells.length === 0) return err(new Error("no cells"));

  const anyCollectionFailed = cells.some((c) => c.collection !== "ok");
  const okRun = cells.every((c) => !cellFailed(c));
  const report = {
    branch,
    outDir,
    collection: anyCollectionFailed ? "failed" : "ok",
    looksGrid: looksOn,
    identities: identities.filter(Boolean),
    routes,
    cells,
    contactSheets,
    pairs,
    statesTicket,
    statesUnverified,
    warnings,
    ok: okRun,
  };
  const recordPath = join(outDir, "manifest.json");
  writeFileSync(recordPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outDir, "summary.md"), formatReportText(report, recordPath));
  return ok(report);
}

function isPeerFailure(error) {
  return error.code === PEER_MISSING || String(error.message).startsWith("install `");
}

function isFlagFailure(error) {
  return error.code === BAD_FLAG;
}

export async function visualVerifyMain(args, sinks, deps) {
  const command = deps?.command === "evidence" ? "evidence" : "visual-verify";
  const parsed = parseVisualVerifyArgs(args);
  if (!parsed.ok) {
    sinks.err(`error: ${parsed.error.message}`);
    sinks.err(usageVisualVerify(command));
    return 2;
  }
  if (parsed.value.help) {
    sinks.out(usageVisualVerify(command));
    return 0;
  }
  if (!parsed.value.url && !parsed.value.dir) {
    sinks.err("error: pass --url, --base-url, or --dir");
    sinks.err(usageVisualVerify(command));
    return 2;
  }
  const result = await runVisualVerify(parsed.value, deps);
  if (!result.ok) {
    sinks.err(`error: ${result.error.message}`);
    return isPeerFailure(result.error) || isFlagFailure(result.error) ? 2 : 1;
  }
  for (const warning of result.value.warnings ?? []) sinks.err(`warning: ${warning}`);
  const recordPath = join(result.value.outDir, "manifest.json");
  const text = formatReportText(result.value, recordPath);
  for (const line of text.trimEnd().split("\n")) sinks.out(line);
  if (parsed.value.md) {
    const mdPath = resolve(parsed.value.cwd ?? process.cwd(), parsed.value.md);
    mkdirSync(dirname(mdPath), { recursive: true });
    writeFileSync(mdPath, `${markdownTable(result.value)}\n`);
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
