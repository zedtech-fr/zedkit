import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { identityDockKeyIntent, shouldRestoreTriggerFocus } from "./use-identity-dock-keyboard.ts";

test("Control+I opens when not typing", () => {
  assert.equal(
    identityDockKeyIntent({ key: "i", metaKey: false, ctrlKey: true }, { expanded: false, typing: false }),
    "open",
  );
});

test("Meta+I opens when not typing", () => {
  assert.equal(
    identityDockKeyIntent({ key: "I", metaKey: true, ctrlKey: false }, { expanded: true, typing: false }),
    "open",
  );
});

test("Control+I is ignored while typing", () => {
  assert.equal(
    identityDockKeyIntent({ key: "i", metaKey: false, ctrlKey: true }, { expanded: false, typing: true }),
    null,
  );
});

test("Escape closes only when expanded", () => {
  assert.equal(
    identityDockKeyIntent({ key: "Escape", metaKey: false, ctrlKey: false }, { expanded: true, typing: false }),
    "close",
  );
  assert.equal(
    identityDockKeyIntent({ key: "Escape", metaKey: false, ctrlKey: false }, { expanded: false, typing: false }),
    null,
  );
});

test("focus restore is true only on the open-to-closed edge", () => {
  assert.equal(shouldRestoreTriggerFocus(true, false), true);
  assert.equal(shouldRestoreTriggerFocus(false, false), false);
  assert.equal(shouldRestoreTriggerFocus(true, true), false);
  assert.equal(shouldRestoreTriggerFocus(false, true), false);
});

test("the hook focuses the trigger on that close edge", () => {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "use-identity-dock-keyboard.ts"), "utf8");
  assert.match(src, /triggerRef\.current\?\.focus\(\)/);
  assert.match(src, /shouldRestoreTriggerFocus/);
});
