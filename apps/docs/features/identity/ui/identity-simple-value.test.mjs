import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets, parseIdentityTokens } from "@zedtech/zedkit-ui";

import {
  RADIUS_MAX,
  RADIUS_MIN,
  SPACING_MAX,
  SPACING_MIN,
  clampedCssLengthRem,
  colorInputHex,
  formatCssLengthRem,
  hexToHslTriplet,
  hslTripletToHex,
  parseCssLengthRem,
} from "./identity-simple-value.ts";

test("black hex becomes a schema-valid HSL triplet", () => {
  const hsl = hexToHslTriplet("#000000");
  assert.equal(hsl, "0 0% 0%");
  const next = {
    ...identityPresets.mist,
    light: { ...identityPresets.mist.light, background: hsl },
  };
  assert.equal(parseIdentityTokens(next).success, true);
});

test("white hex becomes a schema-valid HSL triplet", () => {
  const hsl = hexToHslTriplet("#ffffff");
  assert.equal(hsl, "0 0% 100%");
  const next = {
    ...identityPresets.mist,
    light: { ...identityPresets.mist.light, background: hsl },
  };
  assert.equal(parseIdentityTokens(next).success, true);
});

test("a Glass-like hex round-trips through parse", () => {
  const hex = hslTripletToHex(identityPresets.glass.light.background);
  assert.equal(typeof hex, "string");
  const hsl = hexToHslTriplet(hex);
  assert.equal(typeof hsl, "string");
  const next = {
    ...identityPresets.glass,
    light: { ...identityPresets.glass.light, background: hsl },
  };
  assert.equal(parseIdentityTokens(next).success, true);
});

test("garbage hex and empty values must not produce HSL", () => {
  assert.equal(hexToHslTriplet(""), undefined);
  assert.equal(hexToHslTriplet("NaN"), undefined);
  assert.equal(hexToHslTriplet("#gggggg"), undefined);
  assert.equal(hexToHslTriplet("#000000000000"), undefined);
  assert.equal(hexToHslTriplet("#fff"), "0 0% 100%");
});

test("HSL without percent signs is not a hex colour", () => {
  assert.equal(hslTripletToHex("220 60 97"), undefined);
});

test("0.25rem parses and 0px is zero", () => {
  assert.equal(parseCssLengthRem("0.25rem"), 0.25);
  assert.equal(parseCssLengthRem("0px"), 0);
  assert.equal(formatCssLengthRem(0, { zeroAsPx: true }), "0px");
  assert.equal(formatCssLengthRem(0.25), "0.25rem");
});

test("unparseable length stays undefined", () => {
  assert.equal(parseCssLengthRem("nope"), undefined);
  assert.equal(parseCssLengthRem(""), undefined);
  assert.equal(parseCssLengthRem("NaN"), undefined);
});

test("unparseable colour triplets render as black on the native picker", () => {
  assert.equal(colorInputHex(""), "#000000");
  assert.equal(colorInputHex("not-a-triplet"), "#000000");
  assert.equal(colorInputHex("220 60 97"), "#000000");
  assert.equal(colorInputHex("0 0% 0%"), "#000000");
  assert.equal(colorInputHex("0 0% 100%"), "#ffffff");
});

test("range shown value clamps to min and max and falls back to min", () => {
  assert.equal(clampedCssLengthRem("nope", SPACING_MIN, SPACING_MAX), SPACING_MIN);
  assert.equal(clampedCssLengthRem("", RADIUS_MIN, RADIUS_MAX), RADIUS_MIN);
  assert.equal(clampedCssLengthRem("-1rem", RADIUS_MIN, RADIUS_MAX), RADIUS_MIN);
  assert.equal(clampedCssLengthRem("9rem", RADIUS_MIN, RADIUS_MAX), RADIUS_MAX);
  assert.equal(clampedCssLengthRem("0.25rem", SPACING_MIN, SPACING_MAX), 0.25);
});
