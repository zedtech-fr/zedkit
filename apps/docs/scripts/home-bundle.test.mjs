import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

test("home hero dashboard loads the admin demo through next/dynamic", () => {
  const src = readFileSync(join(app, "ui/home/home-hero-preview.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.match(src, /home-admin-dashboard-demo/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/home-admin-dashboard-demo["']/);
  assert.doesNotMatch(src, /from ["']@\/components\/home-gallery-demos["']/);
});

test("home gallery loads overlay demos through next/dynamic", () => {
  const src = readFileSync(join(app, "components/home-gallery-demos.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/confirm-dialog-demo["']/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/drawer-demo["']/);
  assert.doesNotMatch(src, /home-admin-dashboard-demo/);
});

test("search dialog is lazy and not preloaded on every page", () => {
  const src = readFileSync(join(app, "app/provider.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.match(src, /preload:\s*false/);
  assert.doesNotMatch(src, /from ["']\.\.\/components\/search["']/);
});

test("phone search pill does not import the search client until open", () => {
  const pill = readFileSync(join(app, "ui/search-pill.tsx"), "utf8");
  const body = readFileSync(join(app, "ui/search-pill-body.tsx"), "utf8");
  assert.match(pill, /from "next\/dynamic"/);
  assert.doesNotMatch(pill, /fumadocs-core\/search\/client/);
  assert.match(body, /fumadocs-core\/search\/client/);
  assert.doesNotMatch(pill, /from ["']@\/ui\/search-pill-body["']/);
});
