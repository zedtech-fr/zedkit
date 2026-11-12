import assert from "node:assert/strict";
import test from "node:test";
import { wrapTokenHref } from "../features/docs/wrap-token-href.mjs";

test("wraps links real packages and leaves component notes as text", () => {
  assert.equal(
    wrapTokenHref("@radix-ui/react-checkbox"),
    "https://www.npmjs.com/package/%40radix-ui%2Freact-checkbox",
  );
  assert.equal(wrapTokenHref("lucide-react"), "https://www.npmjs.com/package/lucide-react");
  assert.equal(wrapTokenHref("zod"), "https://www.npmjs.com/package/zod");
  assert.equal(wrapTokenHref("Button"), null);
  assert.equal(wrapTokenHref("size"), null);
  assert.equal(wrapTokenHref("icon"), null);
  assert.equal(wrapTokenHref("IconButton"), null);
  assert.equal(wrapTokenHref("(none)"), null);
  assert.equal(wrapTokenHref("<form>"), null);
});
