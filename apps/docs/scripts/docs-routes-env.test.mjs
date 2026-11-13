import assert from "node:assert/strict";
import test from "node:test";

import { filterPublishedRoutes, looksFromEnv } from "./docs-routes-env.mjs";

test("unset DOCS_ROUTES keeps every published route", () => {
  assert.deepEqual(filterPublishedRoutes(["/", "/docs"], undefined), ["/", "/docs"]);
});

test("blank DOCS_ROUTES fails closed instead of sweeping all routes", () => {
  assert.throws(() => filterPublishedRoutes(["/", "/docs"], ""), /DOCS_ROUTES is set but empty/);
  assert.throws(() => filterPublishedRoutes(["/", "/docs"], "   "), /DOCS_ROUTES is set but empty/);
});

test("DOCS_ROUTES intersect drops unknown paths and fails when nothing remains", () => {
  assert.deepEqual(filterPublishedRoutes(["/", "/catalog", "/docs"], "/catalog,/nope"), ["/catalog"]);
  assert.throws(
    () => filterPublishedRoutes(["/", "/docs"], "/secret"),
    /matched no published route/,
  );
});

test("unset or blank DOCS_LOOKS is the default look, not a sitemap sweep", () => {
  assert.deepEqual(looksFromEnv(undefined), [null]);
  assert.deepEqual(looksFromEnv(""), [null]);
  assert.deepEqual(looksFromEnv("   "), [null]);
});

test("DOCS_LOOKS comma list is those ids", () => {
  assert.deepEqual(looksFromEnv("mist,press"), ["mist", "press"]);
  assert.deepEqual(looksFromEnv(" glass , tide "), ["glass", "tide"]);
  assert.deepEqual(looksFromEnv("mist,"), ["mist"]);
});
