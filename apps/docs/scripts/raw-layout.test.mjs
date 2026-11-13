import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkRawLayoutFile, rawLayoutErrors } from "./raw-layout.mjs";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMPONENTS = join(APP, "components");
const FEATURES = join(APP, "features");
const LINE_BASED = /<(div|span)[\s>/]/;
const SPLIT_DIV = `<div
  className="x">`;
const KIT_LAYOUT = `<Stack gap="md">
  <Heading>Title</Heading>
  <Text as="span">ok</Text>
  <Section>Body</Section>
</Stack>
`;

function tsxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsxFiles(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

test("a split <div / className tag is a hit; the line-based scan misses it", () => {
  const lineHits = SPLIT_DIV.split("\n").filter((line) => LINE_BASED.test(line));
  assert.equal(lineHits.length, 0);
  assert.deepEqual(rawLayoutErrors("fixture.tsx", SPLIT_DIV), [
    "fixture.tsx: raw <div> is banned; use kit Stack/Text/Section/Heading.",
  ]);
});

test("legal kit layout is not a hit, including Text as=span", () => {
  assert.deepEqual(rawLayoutErrors("ok.tsx", KIT_LAYOUT), []);
});

test("allowlisted basenames skip even a split <div", () => {
  assert.deepEqual(checkRawLayoutFile("features/identity/dock/ui/identity-dock-chrome.tsx", SPLIT_DIV), []);
  assert.deepEqual(
    checkRawLayoutFile("components/identity-dock-composer-footer.tsx", SPLIT_DIV),
    [],
  );
  assert.deepEqual(checkRawLayoutFile("features/docs/ui/component-preview.tsx", SPLIT_DIV), []);
  assert.deepEqual(checkRawLayoutFile("components/site-chrome/site-chrome.tsx", SPLIT_DIV), []);
  assert.deepEqual(checkRawLayoutFile("components/frame.tsx", SPLIT_DIV), [
    "components/frame.tsx: raw <div> is banned; use kit Stack/Text/Section/Heading.",
  ]);
});

test("raw-layout check passes on the docs components and features trees", () => {
  const errors = [];
  for (const root of [COMPONENTS, FEATURES]) {
    for (const file of tsxFiles(root)) {
      const rel = file.slice(APP.length + 1);
      errors.push(...checkRawLayoutFile(rel, readFileSync(file, "utf8")));
    }
  }
  assert.deepEqual(errors, []);
});
