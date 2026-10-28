import assert from "node:assert/strict";
import test from "node:test";
import { checkUiExportStates, isUiComponentExport } from "./catalog.mjs";
import "./check-previews.test.mjs";

const example = "packages/ui/tests/unit/four-states.fixture.tsx";
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

test("withStates fixture must name the kit host for each state", () => {
  const errors = [];
  checkUiExportStates(
    {
      symbols: ["DataTable"],
      manifest: {
        example: { fixture: example },
        none: [],
        withStates: {
          DataTable: {
            states: ["loading", "empty", "error"],
            fixture: example,
            vitest: example,
            axe: example,
          },
        },
      },
      fileExists: () => true,
      readFile: () => "export function FourStateSuccess() { return null; }\n",
    },
    errors,
  );
  assert.equal(errors.length, 3);
  assert.match(errors[0], /loading fixture must use `Spinner`/);
  assert.match(errors[1], /empty fixture must use `EmptyState`/);
  assert.match(errors[2], /error fixture must use `ErrorState`/);
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
