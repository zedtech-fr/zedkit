import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const probeRel = "src/colocated-typecheck.probe.test.ts";
const probePath = join(pkgRoot, probeRel);
const tscJs = join(pkgRoot, "..", "..", "node_modules", "typescript", "bin", "tsc");

afterEach(() => {
  rmSync(probePath, { force: true });
});

function tsc(args: string[]) {
  return spawnSync(process.execPath, [tscJs, ...args], {
    cwd: pkgRoot,
    encoding: "utf8",
  });
}

describe("colocated test typecheck", () => {
  it(
    "typechecks a colocated test error and keeps that file out of emit and the pack",
    () => {
      writeFileSync(probePath, 'export const n: number = "probe";\n');

      const tests = tsc(["--pretty", "false", "-p", "tsconfig.tests.json"]);
      expect(tests.status, tests.stdout + tests.stderr).not.toBe(0);
      expect(`${tests.stdout}${tests.stderr}`).toMatch(/colocated-typecheck\.probe/);

      const outDir = mkdtempSync(join(tmpdir(), "zk-ui-tsc-"));
      const prod = tsc([
        "-p",
        "tsconfig.json",
        "--outDir",
        outDir,
        "--tsBuildInfoFile",
        join(outDir, ".tsbuildinfo"),
        "--listEmittedFiles",
      ]);
      expect(prod.status, prod.stdout + prod.stderr).toBe(0);
      expect(`${prod.stdout}${prod.stderr}`).not.toMatch(/colocated-typecheck\.probe/);

      const packDir = mkdtempSync(join(tmpdir(), "zk-ui-pack-"));
      const pack = spawnSync("pnpm", ["pack", "--pack-destination", packDir], {
        cwd: pkgRoot,
        encoding: "utf8",
      });
      expect(pack.status, pack.stdout + pack.stderr).toBe(0);
      const tgz = readdirSync(packDir).find((name) => name.endsWith(".tgz"));
      expect(tgz).toBeDefined();
      const listing = spawnSync("tar", ["-tzf", join(packDir, tgz ?? "")], { encoding: "utf8" });
      expect(listing.status).toBe(0);
      expect(listing.stdout).not.toMatch(/colocated-typecheck\.probe/);
    },
    60_000,
  );
});
