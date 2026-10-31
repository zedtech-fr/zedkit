// Run after `pnpm exec turbo run build --filter=@zedtech/zedkit-docs`.
// Usage: `node apps/docs/scripts/check-first-load-budget.mjs [outDir]`
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HOME_FIRST_LOAD_GZIP_BUDGET,
  budgetErrors,
  measureFirstLoadGzip,
} from "./first-load-budget.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");

export function checkFirstLoadBudget(outDir = join(APP, "out")) {
  const index = join(outDir, "index.html");
  if (!existsSync(index)) {
    return ["check-first-load-budget: missing export (run docs build first): index.html"];
  }
  const { gzipBytes, paths } = measureFirstLoadGzip(outDir, "index.html");
  const errors = budgetErrors({
    label: "docs home (/)",
    gzipBytes,
    budget: HOME_FIRST_LOAD_GZIP_BUDGET,
  });
  if (errors.length === 0) {
    return {
      ok: true,
      message: `check-first-load-budget: ok (home first-load gzip ${gzipBytes} / ${HOME_FIRST_LOAD_GZIP_BUDGET}, ${paths.length} chunks)`,
    };
  }
  return { ok: false, errors };
}

function main() {
  const outDir = resolve(process.argv[2] ?? join(APP, "out"));
  const result = checkFirstLoadBudget(outDir);
  if (Array.isArray(result)) {
    console.error(result.join("\n"));
    process.exitCode = 1;
    return;
  }
  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(result.message);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) main();
