import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { identities } from "@zedtech/zedkit-ui";

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "identity-dock-starting-points.tsx"), "utf8");

test("the kit ships six starting looks, each with a label and a one-line description (#441)", () => {
  assert.equal(identities.length, 6);
  assert.deepEqual(
    identities.map((item) => item.id),
    ["mist", "press", "tide", "volt", "maison", "glass"],
  );
  for (const item of identities) {
    assert.ok(item.label.trim().length > 0);
    assert.ok((item.description ?? "").trim().length > 0);
  }
});

test("starting points map the kit identity registry, with no second list (#441)", () => {
  assert.match(src, /identities.*from "@zedtech\/zedkit-ui"/s);
  assert.match(src, /identities\.map/);
  assert.doesNotMatch(src, /"(mist|press|tide|volt|maison|glass)"/);
  assert.doesNotMatch(src, /\b(Mist|Press|Tide|Volt|Maison|Glass)\b/);
});

test("starting points are native radio cards in one named group (#441)", () => {
  assert.match(src, /OptionCard.*from "@zedtech\/zedkit-ui"/s);
  assert.match(src, /role="radiogroup"/);
  assert.match(src, /aria-label=\{copy\.startingPointsLabel\}/);
  assert.match(src, /type="radio"/);
  assert.match(src, /name=\{name\}/);
  assert.match(src, /checked=\{current === option\.id\}/);
  assert.match(src, /onPick\(option\.id\)/);
  assert.match(src, /useIdentity\(DEFAULT_IDENTITY\)/);
});

test("starting points copy comes from the dock copy module, with the default marked (#441)", () => {
  assert.match(src, /copy\.startingPointsTitle/);
  assert.match(src, /copy\.startingPointsHint/);
  assert.match(src, /copy\.defaultNote/);
  assert.match(src, /option\.id === DEFAULT_IDENTITY/);
  assert.doesNotMatch(src, /Don't start from zero/);
});

test("starting points stay tappable, unclipped and motion-free at phone width (#441)", () => {
  assert.match(src, /min-h-overlay-touch-target/);
  assert.match(src, /data-dock-starting-points/);
  assert.doesNotMatch(src, /truncate|line-clamp|whitespace-nowrap|overflow-hidden/);
  assert.doesNotMatch(src, /transition-|animate-|motion-safe|motion-reduce/);
  assert.doesNotMatch(src, /#[0-9a-fA-F]{3}|hsl\(|rgb\(/);
});
