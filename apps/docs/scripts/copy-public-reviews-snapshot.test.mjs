import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { copyPublicReviewsSnapshot } from "./copy-public-reviews-snapshot.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const script = join(here, "copy-public-reviews-snapshot.mjs");

function tmpPair() {
  const dir = mkdtempSync(join(tmpdir(), "copy-public-reviews-"));
  return { source: join(dir, "source.json"), dest: join(dir, "dest.json") };
}

function entry(overrides = {}) {
  return {
    id: "108-plan",
    runId: "run-108-impl",
    type: "plan",
    status: "completed",
    startedAt: "2026-11-10T16:00:00.000Z",
    durationMs: 420000,
    models: ["cursor-grok-4.6-high"],
    verdict: null,
    liveUrl: "https://example.test/live/run-108-impl",
    ...overrides,
  };
}

function issue(overrides = {}) {
  return {
    number: 108,
    title: "Ship the public issues section",
    state: "closed",
    pullRequests: [133],
    lastRunAt: "2026-11-10T16:00:00.000Z",
    entries: [entry()],
    ...overrides,
  };
}

function pr(overrides = {}) {
  return {
    number: 133,
    issueNumber: 108,
    runIds: ["run-108-impl"],
    ...overrides,
  };
}

function indexSnapshot(issues = [issue()], pullRequests = [pr()], extra = {}) {
  return { version: 1, kind: "public-stand-in", issues, pullRequests, ...extra };
}

function liveItem() {
  return {
    id: "main",
    name: "Main flow",
    kind: "main",
    engine: "test",
    engine_label: "test",
    model: "test-model",
    status: "done",
    duration_s: 12,
    tool_count: 2,
    message_count: 1,
    tokens_in: 10,
    tokens_out: 4,
    started_ms: 1_762_698_500_000,
    last_activity_ms: 1_762_698_600_000,
    entries: [{ type: "message", text: "hello" }],
    prompt: "review this",
    final_text: "approve",
  };
}

function liveRow(overrides = {}) {
  return {
    visibility: "public",
    decision: {
      posted: true,
      must: [{ text: "Name empty states" }],
      notes: [{ text: "The list leads." }],
      dismissed: [],
      degraded: false,
      enforcement_reasons: [],
      verdict: "APPROVE",
      confidence_score: 8.6,
      summary: "Ready.",
    },
    run: {
      run_id: "run-71",
      pr: 71,
      sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      status: "done",
      engine: "test",
      engine_label: "test",
      created_at: 1_762_698_600,
      server_now: 1_762_698_600,
      elapsed_s: 12,
      verdict: "APPROVE",
      live_url: "https://example.test/live/run-71",
    },
    items: [liveItem()],
    verdict_json: { verdict: "APPROVE", blocking: [], notes: [] },
    related: [],
    ...overrides,
  };
}

function liveSnapshot(reviews = [liveRow()], extra = {}) {
  return { version: 1, kind: "public-live-runs", reviews, ...extra };
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("a valid generated run index overwrites dest with the gated payload", () => {
  const { source, dest } = tmpPair();
  writeFileSync(dest, "stale");
  writeJson(source, indexSnapshot());
  copyPublicReviewsSnapshot(source, dest);
  const written = readJson(dest);
  assert.equal(written.version, 1);
  assert.equal(written.kind, "public-stand-in");
  assert.deepEqual(
    written.issues.map((row) => row.number),
    [108],
  );
  assert.equal(written.issues[0].title, "Ship the public issues section");
  assert.equal(written.pullRequests[0].number, 133);
});

test("a valid live-shaped snapshot is accepted and written", () => {
  const { source, dest } = tmpPair();
  writeJson(source, liveSnapshot());
  copyPublicReviewsSnapshot(source, dest);
  const written = readJson(dest);
  assert.equal(written.version, 1);
  assert.equal(written.kind, "public-live-runs");
  assert.ok("reviews" in written);
  assert.equal(written.reviews[0].run.run_id, "run-71");
  assert.equal(written.reviews[0].run.live_url, "https://example.test/live/run-71");
});

test("a live snapshot writes the contract kind, not a raw wrapper kind", () => {
  const { source, dest } = tmpPair();
  writeFileSync(dest, "KEEP");
  writeJson(source, liveSnapshot([liveRow()], { kind: "Bearer abcDEF123._~+/=- from /home/alice" }));
  copyPublicReviewsSnapshot(source, dest);
  const written = readJson(dest);
  assert.equal(written.kind, "public-live-runs");
  assert.doesNotMatch(JSON.stringify(written), /abcDEF123/);
  assert.doesNotMatch(JSON.stringify(written), /\/home\/alice/);
});

test("extra keys on the index survive parse and are not required", () => {
  const { source, dest } = tmpPair();
  writeJson(source, indexSnapshot([issue()], [pr()], { generatedAt: "2026-11-11T00:00:00.000Z" }));
  copyPublicReviewsSnapshot(source, dest);
  const written = readJson(dest);
  assert.equal(written.issues[0].number, 108);
  assert.equal("generatedAt" in written, false);
});

test("visibility private is dropped; missing visibility is kept", () => {
  const { source, dest } = tmpPair();
  writeJson(
    source,
    indexSnapshot(
      [
        issue({ number: 99, visibility: "private", title: "secret", pullRequests: [] }),
        issue({ number: 97, title: "no flag", pullRequests: [] }),
      ],
      [],
    ),
  );
  copyPublicReviewsSnapshot(source, dest);
  const written = readJson(dest);
  assert.deepEqual(
    written.issues.map((row) => row.number),
    [97],
  );
  assert.equal("visibility" in written.issues[0], false);
});

test("a token, Bearer secret, or home path fails closed and dest is unchanged", () => {
  const { source, dest } = tmpPair();
  writeFileSync(dest, "KEEP");
  writeJson(source, indexSnapshot([issue({ title: "notes from /home/" })]));
  assert.throws(() => copyPublicReviewsSnapshot(source, dest), /unredacted token or machine path/);
  assert.equal(readFileSync(dest, "utf8"), "KEEP");

  writeJson(
    source,
    indexSnapshot([
      issue({
        title: "Call with Bearer abcDEF123._~+/=- from /Users/alice/kit",
      }),
    ]),
  );
  writeFileSync(dest, "KEEP-BEARER");
  copyPublicReviewsSnapshot(source, dest);
  const written = readJson(dest);
  assert.match(written.issues[0].title, /Bearer \[redacted\]/);
  assert.doesNotMatch(written.issues[0].title, /abcDEF123/);
  assert.doesNotMatch(written.issues[0].title, /\/Users\/alice/);
});

test("a missing source file leaves dest unchanged", () => {
  const { source, dest } = tmpPair();
  writeFileSync(dest, "KEEP");
  assert.throws(() => copyPublicReviewsSnapshot(source, dest), /cannot read file/);
  assert.equal(readFileSync(dest, "utf8"), "KEEP");
});

test("invalid JSON leaves dest unchanged", () => {
  const { source, dest } = tmpPair();
  writeFileSync(dest, "KEEP");
  writeFileSync(source, "{not json");
  assert.throws(() => copyPublicReviewsSnapshot(source, dest), /invalid JSON/);
  assert.equal(readFileSync(dest, "utf8"), "KEEP");
});

test("a bad-version snapshot leaves dest unchanged", () => {
  const { source, dest } = tmpPair();
  writeFileSync(dest, "KEEP");
  writeJson(source, { ...indexSnapshot(), version: 2 });
  assert.throws(() => copyPublicReviewsSnapshot(source, dest), /version must be 1/);
  assert.equal(readFileSync(dest, "utf8"), "KEEP");
});

test("an unwritable dest fails closed", () => {
  const { source, dest } = tmpPair();
  writeJson(source, indexSnapshot());
  writeFileSync(dest, "KEEP");
  const nested = join(dest, "out.json");
  assert.throws(() => copyPublicReviewsSnapshot(source, nested), /cannot write file/);
  assert.equal(readFileSync(dest, "utf8"), "KEEP");
});

test("CLI requires a source path and a dest path", () => {
  const missing = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /source/);
  const oneArg = spawnSync(process.execPath, [script, "/tmp/missing-source.json"], { encoding: "utf8" });
  assert.notEqual(oneArg.status, 0);
  assert.match(oneArg.stderr, /dest/);
});

test("CLI invoked with a relative script path still writes dest", () => {
  const { source, dest } = tmpPair();
  writeJson(source, indexSnapshot());
  const result = spawnSync(
    process.execPath,
    ["apps/docs/scripts/copy-public-reviews-snapshot.mjs", source, dest],
    { cwd: repoRoot, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readJson(dest).issues[0].number, 108);
});

test("CLI invoked via a symlink still writes dest", () => {
  const { source, dest } = tmpPair();
  writeJson(source, indexSnapshot());
  const link = join(dirname(source), "gate.mjs");
  symlinkSync(script, link);
  const result = spawnSync(process.execPath, [link, source, dest], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readJson(dest).issues[0].number, 108);
});

test("CLI parse failure exits non-zero and leaves dest unchanged", () => {
  const { source, dest } = tmpPair();
  writeFileSync(dest, "KEEP");
  writeFileSync(source, "{");
  const result = spawnSync(process.execPath, [script, source, dest], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid JSON/);
  assert.equal(readFileSync(dest, "utf8"), "KEEP");
});
