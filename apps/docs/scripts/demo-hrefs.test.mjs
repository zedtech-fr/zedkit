import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const demos = join(dirname(fileURLToPath(import.meta.url)), "../components/demos");
const PAGE_SECTIONS = new Set(["usage-and-states", "example", "props"]);
const ALLOWED_PATH = /^\/$|^\/docs(?:\/|$)|^\/issues(?:\/|$)|^\/catalog(?:\/|$)|^\/features(?:\/|$)|^\/r\//;
const HREF = /\bhref\s*[:=]\s*(?:\{\s*)?(`[^`]*`|"[^"]*"|'[^']*')/g;
const ID = /\bid\s*=\s*(?:\{\s*)?(?:`([^`]+)`|"([^"]+)"|'([^']+)')/g;

test("catalog demos have no dead paths or in-page hashes", () => {
  const files = readdirSync(demos).filter((name) => name.endsWith(".tsx"));
  assert.ok(files.length > 0, "demo sources");
  const problems = [];
  for (const file of files) {
    const source = readFileSync(join(demos, file), "utf8");
    const ids = new Set(
      [...source.matchAll(ID)].map((match) => match[1] ?? match[2] ?? match[3]),
    );
    for (const match of source.matchAll(HREF)) {
      const href = match[1].slice(1, -1);
      if (href === "#") continue;
      if (/^https?:\/\//i.test(href)) continue;
      if (href.startsWith("#")) {
        const id = href.slice(1);
        if (!id || !(ids.has(id) || PAGE_SECTIONS.has(id))) {
          problems.push(`${file} ${href}`);
        }
        continue;
      }
      if (href.startsWith("/") && ALLOWED_PATH.test(href)) continue;
      problems.push(`${file} ${href}`);
    }
  }
  assert.deepEqual(problems, []);
});
