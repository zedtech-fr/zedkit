import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  addedExportNames,
  sourceHasExport,
  evaluateReportChange,
} from "./api-report-changeset-gate.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const SEO_DIFF = `diff --git a/packages/seo/etc/zedkit-seo.api.md b/packages/seo/etc/zedkit-seo.api.md
+import type { SoftwareSourceCode } from 'schema-dts';
+export function buildSoftwareSourceCodeJsonLd(options: SoftwareSourceCodeJsonLdOptions): WithContext<SoftwareSourceCode>;
+export interface SoftwareSourceCodeJsonLdOptions {
`;

const MAIN_SEO_INDEX = `export {
  buildArticleJsonLd,
  buildSoftwareSourceCodeJsonLd,
  type SoftwareSourceCodeJsonLdOptions,
} from "./jsonld.js";
`;

describe("addedExportNames", () => {
  it("reads function and interface names from a report diff", () => {
    assert.deepEqual(addedExportNames(SEO_DIFF), [
      "buildSoftwareSourceCodeJsonLd",
      "SoftwareSourceCodeJsonLdOptions",
    ]);
  });

  it("ignores file headers and non-export additions", () => {
    assert.deepEqual(addedExportNames("+++ b/foo\n+import { x } from 'y';\n"), []);
  });
});

describe("evaluateReportChange", () => {
  it("skips a changeset when added exports already exist on origin/main source", () => {
    const result = evaluateReportChange({
      diff: SEO_DIFF,
      kinds: new Set(),
      mainSource: MAIN_SEO_INDEX,
    });
    assert.deepEqual(result, { ok: true, skip: "already-on-main" });
  });

  it("still requires a changeset for a new export not on origin/main", () => {
    const result = evaluateReportChange({
      diff: "+export function buildNewThing(): void;\n",
      kinds: new Set(),
      mainSource: MAIN_SEO_INDEX,
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("does not treat a removal as catch-up even if names exist on main", () => {
    const result = evaluateReportChange({
      diff: "-export function buildSoftwareSourceCodeJsonLd(): void;\n+export function buildSoftwareSourceCodeJsonLd(): void;\n",
      kinds: new Set(),
      mainSource: MAIN_SEO_INDEX,
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "add a changeset");
  });

  it("still requires minor or major when an export line is removed", () => {
    const result = evaluateReportChange({
      diff: '-export type CardProps = React_2.ComponentProps<"div">;\n',
      kinds: new Set(["patch"]),
      mainSource: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "removed needs minor/major");
  });

  it("accepts a minor changeset covering a removed export", () => {
    const result = evaluateReportChange({
      diff: '-export type CardProps = React_2.ComponentProps<"div">;\n+export type CardProps = React_2.ComponentProps<"div"> & {\n',
      kinds: new Set(["minor"]),
      mainSource: "",
    });
    assert.equal(result.ok, true);
  });
});

describe("sourceHasExport", () => {
  it("matches a re-export name from the published SEO index shape", () => {
    assert.equal(sourceHasExport(MAIN_SEO_INDEX, "buildSoftwareSourceCodeJsonLd"), true);
    assert.equal(sourceHasExport(MAIN_SEO_INDEX, "SoftwareSourceCodeJsonLdOptions"), true);
    assert.equal(sourceHasExport(MAIN_SEO_INDEX, "buildNewThing"), false);
  });
});

describe("wiring", () => {
  const sh = readFileSync(join(ROOT, "scripts/check-api-report.sh"), "utf8");

  it("check-api-report.sh runs the gate after the extractor", () => {
    assert.match(sh, /api-report-changeset-gate\.mjs/);
    const extractAt = sh.indexOf("extractor FAILED");
    const gateAt = sh.indexOf("api-report-changeset-gate.mjs");
    assert.ok(extractAt > 0 && gateAt > extractAt);
  });
});
