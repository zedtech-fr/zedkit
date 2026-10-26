// Config-only build: copy the shipped source into dist/ (no compilation).
// Plain file copies; a failure throws and fails the build with its message.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const file of ["index.mjs", "index.d.mts", "eslint.mjs", "eslint.d.mts"]) {
  cpSync(join(root, "src", file), join(dist, file));
}
cpSync(join(root, "tsconfig.base.json"), join(dist, "tsconfig.base.json"));
