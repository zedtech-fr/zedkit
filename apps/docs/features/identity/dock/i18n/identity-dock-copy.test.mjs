import assert from "node:assert/strict";
import test from "node:test";

const { identityDockCopy } = await import("./identity-dock-copy.ts");
const { customIdentityBarCopy } = await import("./custom-identity-bar-copy.ts");

test("starting-points copy frames the six looks as not starting from zero (#441)", () => {
  assert.equal(identityDockCopy.startingPointsTitle, "Don't start from zero");
  assert.equal(
    identityDockCopy.startingPointsHint,
    "Pick a look as your starting point, then adjust the fields below.",
  );
  assert.equal(identityDockCopy.startingPointsLabel, "Starting looks");
  assert.equal(identityDockCopy.defaultNote, "(default)");
});

test("starting-points copy names no preview, no count, and US spelling (#441)", () => {
  const copy = [
    identityDockCopy.startingPointsTitle,
    identityDockCopy.startingPointsHint,
    identityDockCopy.startingPointsLabel,
  ].join("\n");
  assert.doesNotMatch(copy, /preview/i);
  assert.doesNotMatch(copy, /6|\bsix\b/i);
  assert.doesNotMatch(copy, /colour/i);
});

test("custom bar names a stock preset look, not a custom identity (#441)", () => {
  assert.equal(customIdentityBarCopy.presetActive("Mist"), "Mist look active");
});
