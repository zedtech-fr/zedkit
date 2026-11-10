// Original work by the same author.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { inventoryKit, maintenanceBurden } from "./kit-inventory.mjs";

const script = join(fileURLToPath(new URL(".", import.meta.url)), "kit-inventory.mjs");

test("the kit inventory is deterministic and well-formed", () => {
  const first = inventoryKit();
  const second = inventoryKit();
  assert.deepEqual(second, first);
  for (const key of ["skills", "agents", "commands"]) {
    assert.equal(typeof first[key].count, "number");
    assert.ok(first[key].count > 0, `${key} non-empty`);
    assert.deepEqual([...first[key].names].sort(), first[key].names);
  }
  assert.ok(first.files > 0 && Number.isInteger(first.files), "file count");
  assert.ok(first.words > 0 && Number.isInteger(first.words), "word count");
});

test("the maintenance burden names derived files and their regen commands", () => {
  const burden = maintenanceBurden();
  assert.ok(burden.derived.length > 0, "derived entries");
  for (const entry of burden.derived) {
    assert.match(entry.regen, /pnpm|node/, `${entry.file} regen command`);
  }
  assert.ok(
    burden.derived.some((entry) => entry.file.endsWith("legacy-hashes.json")),
    "legacy hashes listed",
  );
});

test("the default report carries no session figures", () => {
  const out = JSON.parse(execFileSync(process.execPath, [script], { encoding: "utf8" }));
  assert.equal(out.sessionCost.status, "unavailable");
  assert.ok(!("byTool" in out.sessionCost), "no tool counts without a log");
  assert.deepEqual(out.inventory, inventoryKit());
});

test("an explicit session log yields observed per-tool cost, unknowns kept apart", () => {
  const dir = mkdtempSync(join(tmpdir(), "kit-inventory-"));
  const path = join(dir, "session.jsonl");
  const lines = [
    { payload_type: "tool_batch.effect.started", payload: { record: { tool_name: "bash" } } },
    { payload_type: "tool_batch.effect.started", payload: { record: { tool_name: "bash" } } },
    { payload_type: "tool_batch.effect.started", payload: { record: { tool_name: "read_file" } } },
    { payload_type: "tool_batch.effect.terminal", payload: {} },
    { payload_type: "command.invoked", payload: {} },
    { payload_type: "something.else", payload: {} },
    "not json at all",
    { nope: true },
  ];
  writeFileSync(path, `${lines.map((line) => (typeof line === "string" ? line : JSON.stringify(line))).join("\n")}\n`);
  const out = JSON.parse(execFileSync(process.execPath, [script, "--session-log", path], { encoding: "utf8" }));
  assert.deepEqual(out.sessionCost, {
    status: "observed",
    lines: 8,
    toolStarted: 3,
    toolTerminal: 1,
    commands: 1,
    byTool: { bash: 2, read_file: 1 },
    unparsed: 2,
  });
});

test("an unrecognized log resolves to unrecognized-format, never invented figures", () => {
  const dir = mkdtempSync(join(tmpdir(), "kit-inventory-"));
  const path = join(dir, "foreign.jsonl");
  writeFileSync(path, '{"hello":"world"}\n["a","b"]\n');
  const out = JSON.parse(execFileSync(process.execPath, [script, "--session-log", path], { encoding: "utf8" }));
  assert.equal(out.sessionCost.status, "unrecognized-format");
  assert.ok(!("byTool" in out.sessionCost), "no tool counts from a foreign log");
});
