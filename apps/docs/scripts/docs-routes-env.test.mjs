import assert from "node:assert/strict";
import test from "node:test";

import { filterPublishedRoutes } from "./docs-routes-env.mjs";

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
