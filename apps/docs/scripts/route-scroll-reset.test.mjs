import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../components/site-chrome/route-scroll-reset.tsx"),
  "utf8",
);

test("RouteScrollReset mounts InPageAnchorScroll beside ScrollReset", () => {
  assert.match(src, /InPageAnchorScroll/);
  assert.match(src, /<ScrollReset routeKey=\{pathname\} \/>/);
  assert.match(src, /<InPageAnchorScroll \/>/);
});
