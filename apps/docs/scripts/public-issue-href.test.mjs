import assert from "node:assert/strict";
import test from "node:test";

import { publicIssueHref, publicIssueHrefFrom } from "../lib/public-issue-href.ts";

function port({ issues = [], unlinked = [] } = {}) {
  return {
    listIssues: async () => issues,
    listUnlinkedPullRequests: async () => unlinked,
  };
}

test("prefers the first public issue path over an unlinked pull request", async () => {
  assert.equal(
    await publicIssueHrefFrom(
      port({ issues: [{ number: 108 }], unlinked: [{ number: 133 }] }),
    ),
    "/issues/108",
  );
});

test("falls back to the first unlinked pull request when no issues exist", async () => {
  assert.equal(
    await publicIssueHrefFrom(port({ unlinked: [{ number: 133 }] })),
    "/issues/pr/133",
  );
});

test("falls back to the issues index when the snapshot is empty, never /issues/0", async () => {
  assert.equal(await publicIssueHrefFrom(port()), "/issues");
  assert.equal(await publicIssueHrefFrom(port({ issues: [{ number: 0 }] })), "/issues");
  assert.equal(
    await publicIssueHrefFrom(port({ issues: [{ number: 0 }], unlinked: [{ number: 0 }] })),
    "/issues",
  );
});

test("the checked-in snapshot href is in the issue sitemap and is not the placeholder", async () => {
  const { createSnapshotReviewPort, listIssueSitemapPaths } = await import(
    "../features/reviews/adapters/snapshot.ts"
  );
  const href = await publicIssueHref();
  const paths = await listIssueSitemapPaths();
  assert.equal(paths.includes(href), true);
  assert.notEqual(href, "/issues/0");
  assert.match(href, /^\/issues(?:\/|$)/);

  const issues = await createSnapshotReviewPort().listIssues();
  if (issues.length === 0) {
    const unlinked = await createSnapshotReviewPort().listUnlinkedPullRequests();
    assert.equal(href, `/issues/pr/${unlinked[0].number}`);
  } else {
    assert.equal(href, `/issues/${issues[0].number}`);
  }
});
