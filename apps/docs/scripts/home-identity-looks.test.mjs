import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = (...parts) => join(app, "ui/home", ...parts);

function readHome(name) {
  return readFileSync(home(name), "utf8");
}

test("home looks ship Glass, Mist, Press, Maison in that order", () => {
  const facts = readHome("home-identity-facts.ts");
  const match = facts.match(/export const IDENTITY_IDS = \[([^\]]+)\]/);
  assert.ok(match, "IDENTITY_IDS export missing");
  const ids = [...match[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["glass", "mist", "press", "maison"]);
  assert.match(facts, /export function isIdentityId/);
  assert.match(facts, /label: "Glass"/);
});

test("look tabs map IDENTITY_IDS rather than hardcoded look names", () => {
  const tabs = readHome("home-identity-looks-tabs.tsx");
  assert.match(tabs, /IDENTITY_IDS\.map/);
  assert.match(tabs, /HOME_IDENTITY_FACTS\[id\]\.label/);
  assert.doesNotMatch(tabs, /["']glass["']|["']mist["']|["']press["']|["']maison["']/);
});

test("one compact Project settings specimen is restyled, not remounted", () => {
  const looks = readHome("home-identity-looks.tsx");
  const specimen = readHome("home-identity-example-mist.tsx");
  const controls = readHome("home-identity-example-mist-controls.tsx");
  assert.match(looks, /useState<IdentityId>\("glass"\)/);
  assert.match(looks, /identity=\{identity\}/);
  assert.match(looks, /HomeIdentityExampleMist/);
  assert.doesNotMatch(looks, /HomeIdentityExamplePress|HomeIdentityExampleMaison/);
  assert.doesNotMatch(looks, /key=\{identity\}/);
  assert.doesNotMatch(looks, /document\.documentElement|documentElement/);
  assert.match(looks, /useLookFade/);
  assert.match(looks, /useMotionOk/);
  assert.match(looks, /data-identity="\$\{identity\}"/);
  assert.match(looks, /bg-primary/);
  const stageCss = readFileSync(join(app, "app/docs-shell-tokens.css"), "utf8");
  assert.match(stageCss, /\[data-home-identity-stage\]\[data-identity="glass"\]/);
  assert.match(stageCss, /background-image:\s*var\(--zk-bg-pattern\)/);
  assert.doesNotMatch(specimen, /HomeIdentityExampleMistMembers|DeleteProject|ConfirmDialog/);
  assert.doesNotMatch(specimen, /alerts/);
  assert.doesNotMatch(controls, /Switch|alertsLabel|onAlerts/);
  assert.match(specimen, /copy\.workspace/);
  assert.match(specimen, /copy\.save/);
  assert.match(specimen, /copy\.discard/);
});

test("press, maison, members and drawer example files are gone", () => {
  for (const name of [
    "home-identity-example-press.tsx",
    "home-identity-example-maison.tsx",
    "home-identity-example-mist-members.tsx",
    "home-identity-example-mist-member-drawer.tsx",
  ]) {
    assert.equal(existsSync(home(name)), false, name);
  }
});

test("specimen copy is the compact panel, not members, billing or other products", () => {
  const copy = readHome("home-identity-examples-copy.ts");
  assert.match(copy, /heading: "Project settings"/);
  assert.match(copy, /workspaceLabel: "Workspace"/);
  assert.match(copy, /regionLabel: "Region"/);
  assert.match(copy, /save: "Save changes"/);
  assert.match(copy, /discard: "Discard"/);
  assert.doesNotMatch(copy, /Delete project|Billing ends|tableAriaLabel|Today's desk|Save piece|Email alerts/);
});
