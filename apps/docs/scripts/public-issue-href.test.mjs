import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { publicIssueHref, publicIssueHrefFrom } from "../features/reviews/compose.ts";

const composeSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../features/reviews/compose.ts"),
  "utf8",
);

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

test("skips non-integers and non-positive numbers (negative row)", async () => {
  assert.equal(
    await publicIssueHrefFrom(port({ issues: [{ number: 1.5 }, { number: -1 }, { number: 0 }] })),
    "/issues",
  );
  assert.equal(
    await publicIssueHrefFrom(
      port({ issues: [{ number: 1.5 }, { number: -1 }], unlinked: [{ number: 9 }] }),
    ),
    "/issues/pr/9",
  );
  assert.equal(
    await publicIssueHrefFrom(port({ issues: [{ number: Number.MAX_SAFE_INTEGER + 1 }, { number: 4 }] })),
    "/issues/4",
  );
});

test("falls back to the issues index when the snapshot port cannot be created", async () => {
  assert.equal(
    await publicIssueHref(() => {
      throw new Error("unreadable snapshot");
    }),
    "/issues",
  );
});

test("compose defaults to the live site factory, not a snapshot JSON import", () => {
  assert.match(composeSource, /createSiteReviewPort/);
  assert.doesNotMatch(composeSource, /createSnapshotReviewPort/);
  assert.doesNotMatch(composeSource, /public-reviews\.json/);
});
