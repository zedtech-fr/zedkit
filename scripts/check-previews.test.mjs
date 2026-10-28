import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { collectGaps, hasJsx } from "../apps/docs/scripts/check-previews.mjs";

test("hasJsx ignores generics and import lines", () => {
  assert.equal(hasJsx("const n = useState<string>(\"\");\n"), false);
  assert.equal(hasJsx('import { Button } from "@zedtech/zedkit-ui";\n'), false);
  assert.equal(hasJsx("export function Row() { return <Button>Save</Button>; }\n"), true);
});

test("collectGaps reports an uncovered JSX example and a stale pending key", () => {
  const { gaps, errors } = collectGaps({
    catalog: {
      packages: {
        "@zedtech/zedkit-ui": {
          needs: [
            {
              need: "Trigger actions with buttons",
              examples: [{ title: "Usage", code: "export function Row() { return <Button>Save</Button>; }\n" }],
            },
          ],
        },
        "@zedtech/zedkit-core": {
          needs: [{ need: "Handle errors", examples: [{ title: "Usage", code: "export const n = 1;\n" }] }],
        },
      },
    },
    rich: {},
    config: {
      nonVisualPackages: ["@zedtech/zedkit-core"],
      optOut: {},
      pending: ["gone::Usage"],
    },
    proseDir: join(tmpdir(), "preview-coverage-missing-prose"),
  });
  assert.deepEqual(gaps, ["Trigger actions with buttons::Usage"]);
  assert.equal(
    errors.some((entry) => entry.includes('pending "gone::Usage" matches no JSX example')),
    true,
  );
});

test("collectGaps is silent when the first example has a page demo", () => {
  const { gaps, errors } = collectGaps({
    catalog: {
      packages: {
        "@zedtech/zedkit-ui": {
          needs: [
            {
              need: "Trigger actions with buttons",
              examples: [{ title: "Usage", code: "export function Row() { return <Button>Save</Button>; }\n" }],
            },
          ],
        },
      },
    },
    rich: { "Trigger actions with buttons": { demo: "ButtonDemo" } },
    config: { nonVisualPackages: [], optOut: {}, pending: [] },
    proseDir: join(tmpdir(), "preview-coverage-missing-prose"),
  });
  assert.deepEqual(gaps, []);
  assert.deepEqual(errors, []);
});

test("collectGaps fails when pending still lists a covered example", () => {
  const { errors } = collectGaps({
    catalog: {
      packages: {
        "@zedtech/zedkit-ui": {
          needs: [
            {
              need: "Trigger actions with buttons",
              examples: [{ title: "Usage", code: "export function Row() { return <Button>Save</Button>; }\n" }],
            },
          ],
        },
      },
    },
    rich: { "Trigger actions with buttons": { demo: "ButtonDemo" } },
    config: {
      nonVisualPackages: [],
      optOut: {},
      pending: ["Trigger actions with buttons::Usage"],
    },
    proseDir: join(tmpdir(), "preview-coverage-missing-prose"),
  });
  assert.equal(
    errors.some((entry) => entry.includes("now has a preview")),
    true,
  );
});

test("guide fence with no-preview is not a gap; a bare JSX fence is", () => {
  const proseDir = mkdtempSync(join(tmpdir(), "preview-coverage-prose-"));
  mkdirSync(join(proseDir, "guides"), { recursive: true });
  writeFileSync(
    join(proseDir, "guides", "sample.mdx"),
    [
      "```tsx title=\"Usage\" no-preview=\"config only\"",
      "export function Row() { return <Button>Save</Button>; }",
      "```",
      "",
      "```tsx title=\"Live\"",
      "export function Row() { return <Button>Save</Button>; }",
      "```",
      "",
    ].join("\n"),
  );
  const { gaps, errors } = collectGaps({
    catalog: { packages: {} },
    rich: {},
    config: { nonVisualPackages: [], optOut: {}, pending: [] },
    proseDir,
  });
  assert.deepEqual(gaps, ["guide:guides/sample::Live"]);
  assert.deepEqual(errors, []);
});
