import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const script = fileURLToPath(new URL("./dts-api-report.mjs", import.meta.url));

test("dts-api-report inlines re-exported declarations", () => {
  const dir = mkdtempSync(join(tmpdir(), "dts-api-"));
  writeFileSync(
    join(dir, "inner.d.ts"),
    'export declare function hidden(n: number): string;\n',
  );
  writeFileSync(
    join(dir, "index.d.ts"),
    'export { hidden } from "./inner.js";\n',
  );
  const out = join(dir, "report.md");
  execFileSync(process.execPath, [script, join(dir, "index.d.ts"), "@tmp/pkg", out], {
    encoding: "utf8",
  });
  const report = readFileSync(out, "utf8");
  assert.match(report, /export declare function hidden/);
  assert.match(report, /API Report File for "@tmp\/pkg"/);
});
