import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { githubIssueHref, githubPullHref } from "./github-hrefs.ts";
import { liveRunParentHref } from "./live-run-parent.ts";

const here = dirname(fileURLToPath(import.meta.url));
const liveConsole = readFileSync(join(here, "../ui/review-live-console.tsx"), "utf8");

test("ticket run with omitted issue and pr set to the issue number backs to the issue page", () => {
  const href = liveRunParentHref({
    kind: "ticket",
    pr: 427,
    pr_url: githubIssueHref(427),
    target_label: "Issue #427",
  });
  assert.equal(href, "/issues/427");
  assert.notEqual(href, "/issues/pr/427");
});

test("ticket run with omitted issue and no pr_url still treats a mis-tagged pr as the issue", () => {
  assert.equal(liveRunParentHref({ kind: "ticket", pr: 427 }), "/issues/427");
});

test("ticket run with issue set and pr unset backs to the issue page", () => {
  assert.equal(liveRunParentHref({ kind: "ticket", issue: 427 }), "/issues/427");
});

test("review run with a pull pr_url backs to the unlinked pull request page", () => {
  assert.equal(
    liveRunParentHref({ kind: "review", pr: 54, pr_url: githubPullHref(54) }),
    "/issues/pr/54",
  );
});

test("ticket run that opened a pull request without an issue field backs to the list", () => {
  assert.equal(
    liveRunParentHref({ kind: "ticket", pr: 387, pr_url: githubPullHref(387) }),
    "/issues",
  );
});

test("run.issue wins over a conflicting pr", () => {
  assert.equal(
    liveRunParentHref({
      kind: "ticket",
      issue: 427,
      pr: 387,
      pr_url: githubPullHref(387),
    }),
    "/issues/427",
  );
});

test("Ticket kind is case-insensitive after trim", () => {
  assert.equal(liveRunParentHref({ kind: "Ticket", pr: 427 }), "/issues/427");
  assert.equal(liveRunParentHref({ kind: " TICKET ", pr: 427 }), "/issues/427");
});

test("pr_url with a hash still yields the issue number", () => {
  assert.equal(
    liveRunParentHref({
      kind: "ticket",
      pr: 427,
      pr_url: `${githubIssueHref(427)}#issuecomment-1`,
    }),
    "/issues/427",
  );
});

test("non-http(s), missing number, and n < 1 are not an issue parent", () => {
  assert.equal(
    liveRunParentHref({
      kind: "review",
      pr: 54,
      pr_url: "ftp://github.com/zedtech-fr/zedkit/issues/427",
    }),
    "/issues/pr/54",
  );
  assert.equal(
    liveRunParentHref({
      kind: "review",
      pr: 54,
      pr_url: "https://github.com/zedtech-fr/zedkit/issues/",
    }),
    "/issues/pr/54",
  );
  assert.equal(liveRunParentHref({ kind: "ticket", issue: 0, pr: 427 }), "/issues/427");
  assert.equal(liveRunParentHref({ kind: "ticket", pr: 0 }), "/issues");
  assert.equal(liveRunParentHref({}), "/issues");
});

test("ticket run with only opened_pr_url at a pull does not build /issues/pr/:n", () => {
  assert.equal(
    liveRunParentHref({
      kind: "ticket",
      pr: 387,
      opened_pr_url: githubPullHref(387),
    }),
    "/issues",
  );
});

test("baked path issue is used when the payload has no issue parent", () => {
  assert.equal(liveRunParentHref({ pr: 54 }, { issueNumber: 427 }), "/issues/427");
});

test("search console ready path calls liveRunParent instead of feeding run.pr to chrome", () => {
  assert.match(liveConsole, /liveRunParent\(/);
  assert.doesNotMatch(liveConsole, /status\.live\.run\.pr \?\? unlinkedPr/);
});
