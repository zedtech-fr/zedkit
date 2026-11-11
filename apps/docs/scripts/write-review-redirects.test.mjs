import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createSnapshotReviewPort } from "../features/reviews/adapters/snapshot.ts";
import { RETIRED_REVIEW_PR_NUMBERS } from "../features/reviews/model/review-routes.ts";
import { writeReviewRedirectStubs } from "./write-review-redirects.mjs";

test("writes stub html for /reviews and every snapshot pull request URL", async () => {
  const dir = mkdtempSync(join(tmpdir(), "review-redir-"));
  const redirects = await writeReviewRedirectStubs(dir);
  assert.ok(redirects.some((row) => row.from === "/reviews" && row.to === "/issues"));
  const port = createSnapshotReviewPort();
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
