import assert from "node:assert/strict";
import test from "node:test";
import { checkUiExportStates, isUiComponentExport } from "./catalog.mjs";
import "./check-previews.test.mjs";

const example = "packages/ui/tests/unit/data-table.test.tsx";
const hint = `Example fixture: \`${example}\``;

test("isUiComponentExport skips types, hooks and utils", () => {
  assert.equal(isUiComponentExport("Button"), true);
  assert.equal(isUiComponentExport("DataTable"), true);
  assert.equal(isUiComponentExport("ButtonProps"), false);
  assert.equal(isUiComponentExport("useUiMessages"), false);
  assert.equal(isUiComponentExport("cn"), false);
  assert.equal(isUiComponentExport("IDENTITY_CHANGE_EVENT"), false);
});

test("missing export names the example fixture", () => {
  const errors = [];
  checkUiExportStates(
    {
      symbols: ["Button", "DataTable"],
      manifest: {
        example: { fixture: example },
        none: [],
        withStates: {
          DataTable: {
            states: ["loading", "empty", "error", "success"],
            fixture: example,
            vitest: example,
            axe: example,
          },
        },
      },
      fileExists: () => true,
    },
    errors,
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /export `Button` has no four-state entry/);
  assert.match(errors[0], new RegExp(hint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("listed none plus withStates passes", () => {
  const errors = [];
  checkUiExportStates(
    {
      symbols: ["Button", "DataTable"],
      manifest: {
        example: { fixture: example },
        none: ["Button"],
        withStates: {
          DataTable: {
            states: ["loading", "empty", "error", "success"],
            fixture: example,
            vitest: example,
            axe: example,
          },
        },
      },
      fileExists: () => true,
    },
    errors,
  );
  assert.deepEqual(errors, []);
});
