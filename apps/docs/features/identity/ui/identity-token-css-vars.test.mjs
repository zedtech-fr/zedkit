import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets, tokensToCssVars } from "@zedtech/zedkit-ui";

import { identityTokenCssVars } from "./identity-token-css-vars.ts";

const varsDump = tokensToCssVars(identityPresets.mist);

test("every Expert CSS variable name is one tokensToCssVars emits for Mist", () => {
  for (const name of Object.values(identityTokenCssVars)) {
    assert.equal(Object.hasOwn(varsDump, name), true, `${name} missing from tokensToCssVars(mist)`);
  }
});

test("Expert labels are CSS variable names, not human Spacing", () => {
  assert.equal(identityTokenCssVars.spacing, "--spacing");
  assert.equal(identityTokenCssVars.background, "--background");
  assert.equal(identityTokenCssVars.primaryForeground, "--primary-foreground");
  for (const name of Object.values(identityTokenCssVars)) {
    assert.equal(name.startsWith("--"), true);
    assert.notEqual(name, "Spacing");
  }
});
