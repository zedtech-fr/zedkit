import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../ui/docs-app-link.tsx"),
  "utf8",
);

test("DocsAppLink defaults prefetch to false on every route", () => {
  assert.match(src, /const resolved = prefetch \?\? false;/);
  assert.doesNotMatch(src, /usePathname/);
  assert.doesNotMatch(src, /!onHome/);
  assert.match(src, /prefetch=\{resolved\}/);
});
