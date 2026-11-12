import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createSnapshotReviewPort } from "../features/reviews/adapters/snapshot.ts";
import { HOSTED_LIVE_HREF_PREFIX } from "../features/reviews/model/public-review.ts";
import { RETIRED_REVIEW_PR_NUMBERS } from "../features/reviews/model/review-routes.ts";
import { writeReviewRedirectStubs } from "./write-review-redirects.mjs";

function snapshotPath() {
  const dir = mkdtempSync(join(tmpdir(), "review-redir-snap-"));
  const path = join(dir, "index.json");
  writeFileSync(
    path,
    JSON.stringify({
      version: 1,
      kind: "generated-run-index",
      issues: [
        {
          number: 108,
          title: "Add a public issues section",
          state: "closed",
          pullRequests: [133],
          lastRunAt: "2026-11-10T18:40:00.000Z",
          entries: [
            {
              id: "108-impl",
              runId: "run-108-impl",
              type: "implement",
              status: "completed",
              startedAt: "2026-11-10T16:10:00.000Z",
              durationMs: 1000,
              models: ["cursor-grok-4.6-high"],
              verdict: null,
              liveUrl: `${HOSTED_LIVE_HREF_PREFIX}run-108-impl`,
            },
          ],
        },
      ],
      pullRequests: [
        { number: 133, issueNumber: 108, runIds: ["run-108-impl"] },
        {
          number: 54,
          issueNumber: null,
          runIds: ["run-54-review"],
          entries: [
            {
              id: "54-review",
              runId: "run-54-review",
              type: "review",
              status: "completed",
              startedAt: "2026-11-09T12:00:00.000Z",
              durationMs: 1000,
              models: [],
              verdict: "comment",
              liveUrl: null,
            },
          ],
        },
      ],
    }),
  );
  return path;
}

test("writes stub html for /reviews and every snapshot pull request URL", async () => {
  const dir = mkdtempSync(join(tmpdir(), "review-redir-"));
  const port = createSnapshotReviewPort(snapshotPath());
  const redirects = await writeReviewRedirectStubs(dir, port);
  assert.ok(redirects.some((row) => row.from === "/reviews" && row.to === "/issues"));
  const pullRequests = await port.listPullRequests();
  assert.ok(pullRequests.length > 0);
  for (const entry of pullRequests) {
    const prFile = join(dir, `reviews/pr/${entry.number}.html`);
    const html = readFileSync(prFile, "utf8");
    const expected = entry.issueNumber === null ? `/issues/pr/${entry.number}` : `/issues/${entry.issueNumber}`;
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /location\.replace/);
    for (const runId of entry.runIds) {
      const runFile = join(dir, `reviews/pr/${entry.number}/runs/${runId}.html`);
      const runHtml = readFileSync(runFile, "utf8");
      assert.match(runHtml, /location\.replace/);
    }
  }
  const root = readFileSync(join(dir, "reviews.html"), "utf8");
  assert.match(root, /\/issues/);
  for (const n of RETIRED_REVIEW_PR_NUMBERS) {
    const retired = readFileSync(join(dir, `reviews/pr/${n}.html`), "utf8");
    assert.match(retired, /\/issues/);
    assert.match(retired, /location\.replace/);
  }
});
