import assert from "node:assert/strict";
import test from "node:test";

import { identityPresets } from "@zedtech/zedkit-ui";

import { tokensForLook } from "../lib/identity-look.ts";

test("tokensForLook returns a preset by id", () => {
  assert.equal(tokensForLook("mist", []), identityPresets.mist);
  assert.equal(tokensForLook("glass", []), identityPresets.glass);
});

test("tokensForLook returns a named look by id and nothing for an unknown id", () => {
  const named = [{ id: "named-atelier", tokens: identityPresets.press }];
  assert.equal(tokensForLook("named-atelier", named), identityPresets.press);
  assert.equal(tokensForLook("named-missing", named), undefined);
  assert.equal(tokensForLook("not-a-look", []), undefined);
});
