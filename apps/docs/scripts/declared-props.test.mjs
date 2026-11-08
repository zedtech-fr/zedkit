import assert from "node:assert/strict";
import test from "node:test";
import { registryHostName } from "../lib/declared-props.mjs";

test("registryHostName uses the basename so nested sources keep the Button MDN host", () => {
  assert.equal(registryHostName("button.tsx"), "button");
  assert.equal(registryHostName("button/button.tsx"), "button");
  assert.equal(registryHostName("overlays/dialog/dialog.tsx"), "dialog");
});
