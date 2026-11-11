import assert from "node:assert/strict";
import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyUiSetup,
  assertUiDoneCheck,
  assertValidateOk,
  copyHost,
  runAiSetup,
  runValidate,
} from "../fixtures/setup-map.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const HOUSE = "src/lib/house-notes.ts";

function houseNotes(dest) {
  return readFileSync(join(dest, HOUSE), "utf8");
}

function snapshot(dest) {
  const files = [];
  const walk = (rel) => {
    for (const name of readdirSync(join(dest, rel)).sort()) {
      const next = rel === "" ? name : `${rel}/${name}`;
      if (statSync(join(dest, next)).isDirectory()) walk(next);
      else files.push([next, readFileSync(join(dest, next), "utf8")]);
    }
  };
  walk("");
  return files;
}

function withHost(t) {
  const dest = copyHost();
  t.after(() => rmSync(dest, { recursive: true, force: true }));
  return dest;
}

test("AI-only setup validates on the vendored host", async (t) => {
  const dest = withHost(t);
  const before = houseNotes(dest);
  const setup = await runAiSetup(dest);
  assert.equal(setup.code, 0, setup.err || setup.out);
  assertValidateOk(await runValidate(dest));
  assert.equal(houseNotes(dest), before);
});

test("UI-only apply pins CSS wiring, preserves house notes, and is idempotent", (t) => {
  const dest = withHost(t);
  const before = houseNotes(dest);
  const pageBefore = readFileSync(join(dest, "src/app/page.tsx"), "utf8");
  applyUiSetup(dest);
  assertUiDoneCheck(dest);
  const css = readFileSync(join(dest, "src/app/globals.css"), "utf8");
  assert.match(css, /@source "\.\.\/\.\.\/node_modules\/@zedtech\/zedkit-ui\/src/);
  assert.equal(css.includes('@source "../node_modules/'), false);
  const version = JSON.parse(readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")).version;
  assert.equal(JSON.parse(readFileSync(join(dest, "package.json"), "utf8")).dependencies["@zedtech/zedkit-ui"], version);
  assert.ok(readFileSync(join(dest, "src/app/fonts.ts"), "utf8").includes("@fontsource-variable/inter"));
  assert.ok(readFileSync(join(dest, "src/app/layout.tsx"), "utf8").includes('data-identity="glass"'));
  assert.equal(readFileSync(join(dest, "src/app/page.tsx"), "utf8"), pageBefore);
  assert.equal(houseNotes(dest), before);
  const afterFirst = snapshot(dest);
  applyUiSetup(dest);
  assert.deepEqual(snapshot(dest), afterFirst);
  assert.equal(houseNotes(dest), before);
});

test("UI then AI reaches both done-checks with one validate", async (t) => {
  const dest = withHost(t);
  const before = houseNotes(dest);
  applyUiSetup(dest);
  const setup = await runAiSetup(dest);
  assert.equal(setup.code, 0, setup.err || setup.out);
  assertUiDoneCheck(dest);
  assert.equal(houseNotes(dest), before);
  assertValidateOk(await runValidate(dest));
});

test("missing ai dist fails with a build hint", async (t) => {
  const dest = withHost(t);
  await assert.rejects(
    () => runAiSetup(dest, join(tmpdir(), "missing-zedkit-ai-cli.js")),
    /build `@zedtech\/zedkit-ai` first/,
  );
});

test("fixture source does not call the live Next recipe runner", () => {
  const needle = ["adoption", "smoke"].join("-");
  const testSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const helperSrc = readFileSync(join(HERE, "../fixtures/setup-map.mjs"), "utf8");
  assert.equal(testSrc.includes(needle), false);
  assert.equal(helperSrc.includes(needle), false);
});
