/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning real issue work; maintainer reproducing a look via share link.
 * UI decisions:
 * - Issue list at /issues with title, state, linked PRs, and latest status first — because: hurried visitor scans work without opening every issue.
 * - Separate unlinked-PR block — because: those runs must stay reachable without colliding with GitHub issue numbers.
 * - Stacked rows, not a wide table — because: phone users at 390px compose by priority.
 * - Timeline is chronological stacked rows with type, models, duration, verdict/status — because: hurried visitor follows plan → implement → review → improve.
 * - Plan and implement are distinct rows even when they share a runId — because: they are separate phases of the work.
 * - Provisional run page is a short page with one primary hosted-console link (or a placeholder) — because: this is not a second console.
 * - Appearance / ThemeScope frame stays — because: this section remains the identity testing ground.
 * - Empty state says public issues will show up here — because: the visitor always has a next thought.
 * - Not-found links back to /issues — because: a missing issue must not strand the visitor.
 */

import { notFound, redirect } from "next/navigation";

import { createSnapshotReviewPort } from "./adapters/snapshot";
import { reviewsCopy } from "./i18n/reviews-copy";
import { parsePrNumber } from "./model/pr-number";
import {
  listIssueParamsFrom,
  listIssueRunParamsFrom,
  listReviewPrParamsFrom,
  listReviewRunParamsFrom,
  listUnlinkedPrParamsFrom,
  listUnlinkedRunParamsFrom,
  redirectPathForPr,
  redirectPathForPrRun,
} from "./model/review-routes";
import { isRunRecord } from "./ports/review-port";
import { ReviewListView } from "./ui/review-list-view";
import { ReviewPrView, UnlinkedPrView } from "./ui/review-pr-view";
import { ReviewRunView, UnlinkedRunView } from "./ui/review-run-view";

const port = createSnapshotReviewPort();

export async function ReviewListFeature() {
  const issues = await port.listIssues();
  const unlinked = await port.listUnlinkedPullRequests();
  return <ReviewListView issues={issues} unlinked={unlinked} copy={reviewsCopy} />;
}

export async function ReviewIssueFeature({ n }: { n: string }) {
  const number = parsePrNumber(n);
  const issue = number === null ? null : await port.getIssue(number);
  if (issue === null) notFound();
  return <ReviewPrView issue={issue} copy={reviewsCopy} />;
}

export async function ReviewUnlinkedFeature({ n }: { n: string }) {
  const number = parsePrNumber(n);
  const pullRequest = number === null ? null : await port.getUnlinkedPullRequest(number);
  if (pullRequest === null) notFound();
  return <UnlinkedPrView pullRequest={pullRequest} copy={reviewsCopy} />;
}

export async function ReviewIssueRunFeature({ n, id }: { n: string; id: string }) {
  const number = parsePrNumber(n);
  const issue = number === null ? null : await port.getIssue(number);
  const run = number === null ? null : await port.getRun(number, id);
  if (issue === null || run === null || !isRunRecord(run)) notFound();
  return <ReviewRunView issue={issue} run={run} copy={reviewsCopy} />;
}

export async function ReviewUnlinkedRunFeature({ n, id }: { n: string; id: string }) {
  const number = parsePrNumber(n);
  const pullRequest = number === null ? null : await port.getUnlinkedPullRequest(number);
  const run = number === null ? null : await port.getUnlinkedRun(number, id);
  if (pullRequest === null || run === null) notFound();
  return <UnlinkedRunView pullRequest={pullRequest} run={run} copy={reviewsCopy} />;
}

export async function redirectReviewsIndex() {
  redirect("/issues");
}

export async function redirectReviewsPr({ n }: { n: string }) {
  const number = parsePrNumber(n);
  const resolved = number === null ? null : await port.resolvePr(number);
  if (number === null || resolved === null) notFound();
  redirect(redirectPathForPr(resolved.issueNumber, number));
}

export async function redirectReviewsPrRun({ n, id }: { n: string; id: string }) {
  const number = parsePrNumber(n);
  const resolved = number === null ? null : await port.resolvePr(number);
  if (number === null || resolved === null || !resolved.runIds.includes(id)) notFound();
  redirect(redirectPathForPrRun(resolved.issueNumber, number, id));
}

export async function listIssueParams() {
  return listIssueParamsFrom(port);
}

export async function listIssueRunParams() {
  return listIssueRunParamsFrom(port);
}

export async function listUnlinkedPrParams() {
  return listUnlinkedPrParamsFrom(port);
}

export async function listUnlinkedRunParams() {
  return listUnlinkedRunParamsFrom(port);
}

export async function listReviewPrParams() {
  return listReviewPrParamsFrom(port);
}

export async function listReviewRunParams() {
  return listReviewRunParamsFrom(port);
}

export { parsePrNumber, reviewsCopy };
