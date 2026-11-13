import assert from "node:assert/strict";
import test from "node:test";

import { GITHUB_REPO, githubIssueHref, githubPullHref } from "./github-hrefs.ts";
import { issueOpenTarget } from "./issue-open-target.ts";

test("GitHub hrefs point at the public zedkit repo", () => {
  assert.equal(GITHUB_REPO, "zedtech-fr/zedkit");
  assert.equal(githubIssueHref(241), "https://github.com/zedtech-fr/zedkit/issues/241");
  assert.equal(githubPullHref(250), "https://github.com/zedtech-fr/zedkit/pull/250");
});

test("issue open target prefers a specific hash over open=first", () => {
  assert.equal(issueOpenTarget("open=first", ""), "first");
  assert.equal(issueOpenTarget("?open=first", "#first"), "first");
  assert.equal(issueOpenTarget("identity=volt&open=first", ""), "first");
  assert.equal(issueOpenTarget("", "#first"), "first");
  assert.equal(issueOpenTarget("open=first", "#issue-241"), "issue-241");
  assert.equal(issueOpenTarget("", "#pr-54"), "pr-54");
  assert.equal(issueOpenTarget("", "#issue-x"), null);
  assert.equal(issueOpenTarget("open=all", ""), null);
  assert.equal(issueOpenTarget("", ""), null);
});
