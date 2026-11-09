#!/usr/bin/env node
// Quickstart smoke, last step: the built app really shows the styled kit Button.
// Usage: node scripts/quickstart-render-check.mjs <dist dir | page URL> <label>
// A passing build does not prove the CSS reached the page; this loads the
// app in Chromium and reads what the browser painted. A static directory is
// served locally; an http(s) URL (e.g. `next start`) is checked directly.
/* global document, getComputedStyle -- used inside page.evaluate, which runs in the browser */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const [target = "dist", label = "quickstart"] = process.argv.slice(2);
const useUrl = /^https?:\/\//u.test(target);
const root = useUrl ? null : resolve(target);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

let server = null;
let base = target;
if (!useUrl) {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let file = join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) file = join(root, "index.html");
    res.setHeader("content-type", TYPES[extname(file)] ?? "application/octet-stream");
    createReadStream(file).pipe(res);
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}/`;
}

const browser = await chromium.launch();
const failures = [];

async function check() {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const button = page.getByRole("button", { name: "Save" });
  await button.waitFor({ timeout: 5000 });
  const paint = await button.evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, radius: Number.parseFloat(s.borderTopLeftRadius), height: el.getBoundingClientRect().height, paddingInline: Number.parseFloat(s.paddingLeft), size: Number.parseFloat(s.fontSize) };
  });
  // A browser-default button is buttonface grey, square, and unpadded.
  if (paint.background === "rgb(239, 239, 239)" || paint.background === "rgba(0, 0, 0, 0)") failures.push(`background is ${paint.background}`);
  if (!(paint.radius > 0)) failures.push(`corners are square (${paint.radius}px)`);
  if (!(paint.height >= 36)) failures.push(`height ${paint.height}px`);
  if (!(paint.paddingInline >= 12)) failures.push(`padding ${paint.paddingInline}px`);
  if (errors.length) failures.push(`console errors: ${errors.join(" | ")}`);
  console.log(`${label}: button paints`, JSON.stringify(paint));
}

await check()
  .catch((error) => failures.push(`could not render the page: ${error instanceof Error ? error.message : String(error)}`))
  .finally(async () => {
    await browser.close();
    if (server) server.close();
  });
if (failures.length) {
  console.error(`${label}: styled button check failed: ${failures.join("; ")}`);
  process.exit(1);
}
console.log(`${label}: styled button ok`);
