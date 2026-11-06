import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const uiBuild = spawnSync("pnpm", ["--filter", "@zedtech/zedkit-ui", "build"], {
  cwd: ROOT,
  encoding: "utf8",
  stdio: "pipe",
});
if (uiBuild.status !== 0) {
  console.error(uiBuild.stderr || uiBuild.stdout);
  process.exit(uiBuild.status ?? 1);
}

const typecheck = spawnSync(
  "pnpm",
  ["--filter", "@zedtech/zedkit-docs", "exec", "tsc", "--noEmit", "-p", "tsconfig.tutorial-snippet.json"],
  { cwd: ROOT, encoding: "utf8" },
);

if (typecheck.status !== 0) {
  console.error(typecheck.stdout || typecheck.stderr);
  process.exit(typecheck.status ?? 1);
}

console.log("admin-dashboard-tutorial: ok");
