import assert from "node:assert/strict";
import test from "node:test";

import { GITHUB_REPO, githubIssueHref, githubPullHref, issueFullTitle } from "./github-hrefs.ts";
import { issueOpenTarget, resolveIssueOpenId, shouldScrollSelectedIssue } from "./issue-open-target.ts";

test("GitHub hrefs point at the public zedkit repo", () => {
  assert.equal(GITHUB_REPO, "zedtech-fr/zedkit");
  assert.equal(githubIssueHref(241), "https://github.com/zedtech-fr/zedkit/issues/241");
  assert.equal(githubPullHref(250), "https://github.com/zedtech-fr/zedkit/pull/250");
});

test("issueFullTitle is the visible #N title used on the list, detail, and live region", () => {
  assert.equal(issueFullTitle({ number: 108, title: "Public run console" }), "#108 Public run console");
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

test("resolveIssueOpenId defaults to the first id", () => {
  const ids = ["issue-386", "issue-108", "pr-54"];
  assert.equal(resolveIssueOpenId(ids, "", ""), "issue-386");
  assert.equal(resolveIssueOpenId(ids, "?open=first", ""), "issue-386");
  assert.equal(resolveIssueOpenId(ids, "", "#first"), "issue-386");
  assert.equal(resolveIssueOpenId(ids, "open=first", "#issue-108"), "issue-108");
  assert.equal(resolveIssueOpenId(ids, "", "#pr-54"), "pr-54");
  assert.equal(resolveIssueOpenId(ids, "", "#issue-x"), "issue-386");
  assert.equal(resolveIssueOpenId([], "", ""), null);
});

test("resolveIssueOpenId does not fall back when the hash names a missing row", () => {
  const ids = ["issue-386", "issue-108", "pr-54"];
  assert.equal(resolveIssueOpenId(ids, "", "#issue-999"), null);
  assert.equal(resolveIssueOpenId(ids, "open=first", "#pr-0"), null);
  assert.equal(resolveIssueOpenId([], "", "#issue-108"), null);
});

test("shouldScrollSelectedIssue only for a specific hash on desktop", () => {
  assert.equal(shouldScrollSelectedIssue("#issue-108", true), true);
  assert.equal(shouldScrollSelectedIssue("pr-54", true), true);
  assert.equal(shouldScrollSelectedIssue("#issue-108", false), false);
  assert.equal(shouldScrollSelectedIssue("#first", true), false);
  assert.equal(shouldScrollSelectedIssue("", true), false);
  assert.equal(shouldScrollSelectedIssue("#issue-x", true), false);
});
