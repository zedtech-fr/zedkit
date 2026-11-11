import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { publicIssueHref, publicIssueHrefFrom } from "../features/reviews/compose.ts";

const snapshotPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../features/reviews/adapters/public-reviews.json",
);

function port({ issues = [], unlinked = [] } = {}) {
  return {
    listIssues: async () => issues,
    listUnlinkedPullRequests: async () => unlinked,
  };
}

function isPositive(value) {
  return Number.isSafeInteger(value) && value > 0;
}

/** Independent of ReviewPort: first public positive issue, else first public PR. */
function firstPositiveHrefFromRaw(raw) {
  const issues = Array.isArray(raw?.issues) ? raw.issues : [];
  const issueNumber = issues
    .filter((row) => row?.visibility !== "private")
    .map((row) => row?.number)
    .find(isPositive);
  if (issueNumber !== undefined) return `/issues/${issueNumber}`;

  const reviews = Array.isArray(raw?.reviews) ? raw.reviews : [];
  const livePr = reviews
    .filter((row) => row?.visibility === "public")
    .map((row) => row?.run?.pr)
    .find(isPositive);
  if (livePr !== undefined) return `/issues/pr/${livePr}`;

  const pullRequests = Array.isArray(raw?.pullRequests) ? raw.pullRequests : [];
  const unlinked = pullRequests
    .filter((row) => row?.issueNumber == null && row?.visibility !== "private")
    .map((row) => row?.number)
    .find(isPositive);
  if (unlinked !== undefined) return `/issues/pr/${unlinked}`;
  return "/issues";
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

test("the checked-in snapshot href matches an independent first-positive oracle", async () => {
  const raw = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const expected = firstPositiveHrefFromRaw(raw);
  const href = await publicIssueHref();
  assert.equal(href, expected);
  assert.notEqual(href, "/issues/0");
  assert.match(href, /^\/issues(?:\/|$)/);
});
