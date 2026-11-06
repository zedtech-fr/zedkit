import assert from "node:assert/strict";
import test from "node:test";
import { checkRegistryUrlFiles, unknownRegistryBricks } from "./check-registry-urls.mjs";

const allowed = new Set(["button", "input"]);

test("unknownRegistryBricks ignores a published brick and uppercase paths", () => {
  assert.deepEqual(unknownRegistryBricks('href="/r/button.json"', allowed), []);
  assert.deepEqual(unknownRegistryBricks('href="/r/Button.json"', allowed), []);
});

test("checkRegistryUrlFiles names the file and the missing brick", () => {
  const errors = checkRegistryUrlFiles(
    [{ rel: "ui/home.tsx", text: 'const url = "/r/toast.json";' }],
    allowed,
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^ui\/home\.tsx: \/r\/toast\.json is not in registry\.json/);
  assert.match(errors[0], /published: button, input/);
});

test("checkRegistryUrlFiles is silent when every brick is published", () => {
  const errors = checkRegistryUrlFiles(
    [{ rel: "guides/copy.mdx", text: "npx shadcn add https://zedkit.app/r/button.json" }],
    allowed,
  );
  assert.deepEqual(errors, []);
});
