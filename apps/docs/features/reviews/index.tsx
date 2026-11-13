/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning real issue work; maintainer reproducing a look via share link.
 * UI decisions:
 * - Issue list at /issues with title, state, linked PRs, and latest status first; the title opens the latest run and Timeline is a labelled secondary — because: hurried visitor scans work and reaches a run in one click.
 * - Separate unlinked-PR block — because: those runs must stay reachable without colliding with GitHub issue numbers.
 * - Public run history list stays in the shared appearance-frame Container (width wide) — because: a hurried visitor at 1440 expects the same centered column as an issue detail page.
 * - Issue and unlinked rows are two bands below md (title plus Timeline, then badges and date), one scan row from md — because: a hurried visitor on a phone scans one band per run without chasing wrapped fragments.
 * - Timeline is chronological stacked rows with type, models, duration, verdict/status — because: hurried visitor follows plan → implement → review → improve.
 * - Plan and implement are distinct rows even when they share a runId — because: they are separate phases of the work.
 * - Live-backed `/issues/N/runs/<id>` mounts the shared kit console — because: hurried visitor reads the recorded run in the shared shell.
 * - Index-only runs keep the hosted-console link (or a placeholder) — because: failed or in-progress rows without a console body still resolve, and this is not a second console.
 * - Index-only and unlinked run summaries sit on a hairline Surface (elevation 0, page fill) with a site-action hosted-console control — because: a hurried visitor reads on a white page; indigo is kit Glass primary and must not compete with the content.
 * - Appearance / ThemeScope frame stays as the page shell and an optional share-URL pin — because: a saved appearance query still reproduces a look; an empty query inherits the site so the dock is enough. Do not restore an inline form as a testing ground. The console uses `ReviewConsoleAppearanceFrame` (dense strip) only.
 * - Empty state says no public runs yet — because: the visitor always has a next thought.
 * - Load error uses the route PageHeader plus kit ErrorState with an All issues link and no Retry — because: a nested URL must not keep the list heading (WCAG 2.4.6), the HTML is baked at build time so a reload would serve the same page, and the visitor still needs a way off the dead-end.
 * - Not-found links back to /issues — because: a missing issue must not strand the visitor.
 * - List has no search or state/verdict filter — because: the public list is short enough to scan.
 * - Unlinked and timeline links use the visible title as the accessible name — because: speech-control users say the title they see (WCAG 2.5.3).
 * - List and timeline rows use py-row — because: hurried visitors at 390px need scan rhythm, not section padding between rows.
 * - Views stay client components — because: the frame is a client component that reads the share URL on mount.
 * - Retired /reviews/pr/64|79|80 stubs are export-only; run-level retired URLs 404 — because: run ids are unknowable once retired.
 */

import { notFound, redirect } from "next/navigation";

import { createSiteReviewPort } from "./adapters/live";
import { reviewsCopy } from "./i18n/reviews-copy";
import { parsePrNumber } from "./model/pr-number";
import {
  issueIndexRobotsFrom,
  linkedPrFallbackPath,
  linkedPrRunFallbackPath,
  listIssueParamsFrom,
  listIssueRunParamsFrom,
  listReviewPrParamsFrom,
  listReviewRunParamsFrom,
  listUnlinkedPrParamsFrom,
  listUnlinkedRunParamsFrom,
  redirectPathForPr,
  redirectPathForPrRun,
} from "./model/review-routes";
import { toAgentConsole } from "./model/to-agent-console";
import { isRunRecord } from "./ports/review-port";
import { ReviewConsoleView } from "./ui/review-console-view";
import { ReviewLoadErrorView } from "./ui/review-load-error-view";
import { ReviewNotFoundView } from "./ui/review-not-found-view";
import { ReviewListView } from "./ui/review-list-view";
import { ReviewPrView, UnlinkedPrView } from "./ui/review-pr-view";
import { ReviewRunView, UnlinkedRunView } from "./ui/review-run-view";

const port = createSiteReviewPort();

async function reviewLoadErrorView(header: { title: string; description: string }) {
  if (await port.hasLoadError()) {
    return (
      <ReviewLoadErrorView
        copy={reviewsCopy}
        title={header.title}
        description={header.description}
      />
    );
  }
  return null;
}

export async function ReviewMissingFeature({
  title,
  body,
  backLabel,
}: {
  title: string;
  body: string;
  backLabel: string;
}) {
  const loadError = await reviewLoadErrorView({ title, description: body });
  if (loadError !== null) return loadError;
  return <ReviewNotFoundView title={title} body={body} backLabel={backLabel} />;
}

export async function issuesIndexRobots() {
  return issueIndexRobotsFrom(port);
}

export async function ReviewListFeature() {
  const loadError = await reviewLoadErrorView({
    title: reviewsCopy.list.title,
    description: reviewsCopy.list.description,
  });
  if (loadError !== null) return loadError;
  const issues = await port.listIssues();
  const unlinked = await port.listUnlinkedPullRequests();
  return <ReviewListView issues={issues} unlinked={unlinked} copy={reviewsCopy} />;
}

export async function ReviewIssueFeature({ n }: { n: string }) {
  const loadError = await reviewLoadErrorView({
    title: reviewsCopy.metadata.issue.title,
    description: reviewsCopy.metadata.issue.description,
  });
  if (loadError !== null) return loadError;
  const number = parsePrNumber(n);
  const issue = number === null ? null : await port.getIssue(number);
  if (issue === null) notFound();
  return <ReviewPrView issue={issue} copy={reviewsCopy} />;
}

export async function ReviewUnlinkedFeature({ n }: { n: string }) {
  const number = parsePrNumber(n);
  const pullRequest =
    number === null ? null : await port.getUnlinkedPullRequest(number);
  if (pullRequest !== null) {
    return <UnlinkedPrView pullRequest={pullRequest} copy={reviewsCopy} />;
  }
  const resolved = number === null ? null : await port.resolvePr(number);
  const fallback = linkedPrFallbackPath(resolved?.issueNumber ?? null);
  if (fallback !== null) redirect(fallback);
  const loadError = await reviewLoadErrorView({
    title: reviewsCopy.metadata.unlinked.title,
    description: reviewsCopy.metadata.unlinked.description,
  });
  if (loadError !== null) return loadError;
  notFound();
}

export async function ReviewIssueRunFeature({
  n,
  id,
}: {
  n: string;
  id: string;
}) {
  const number = parsePrNumber(n);
  const issue = number === null ? null : await port.getIssue(number);
  const run = number === null ? null : await port.getRun(number, id);
  if (issue === null || run === null) {
    const loadError = await reviewLoadErrorView({
      title: reviewsCopy.metadata.run.title,
      description: reviewsCopy.metadata.run.description,
    });
    if (loadError !== null) return loadError;
    notFound();
  }
  if (isRunRecord(run)) {
    return <ReviewRunView issue={issue} run={run} copy={reviewsCopy} />;
  }
  const mapped = toAgentConsole(run);
  return (
    <ReviewConsoleView
      issueNumber={issue.number}
      runId={id}
      run={mapped.run}
      items={mapped.items}
      decision={mapped.decision ?? null}
      copy={reviewsCopy}
    />
  );
}

export async function ReviewUnlinkedRunFeature({
  n,
  id,
}: {
  n: string;
  id: string;
}) {
  const number = parsePrNumber(n);
  const pullRequest =
    number === null ? null : await port.getUnlinkedPullRequest(number);
  const run = number === null ? null : await port.getUnlinkedRun(number, id);
  if (pullRequest !== null && run !== null) {
    return (
      <UnlinkedRunView pullRequest={pullRequest} run={run} copy={reviewsCopy} />
    );
  }
  const resolved = number === null ? null : await port.resolvePr(number);
  if (resolved !== null && resolved.runIds.includes(id)) {
    const fallback = linkedPrRunFallbackPath(resolved.issueNumber, id);
    if (fallback !== null) redirect(fallback);
  }
  const loadError = await reviewLoadErrorView({
    title: reviewsCopy.metadata.run.title,
    description: reviewsCopy.metadata.run.description,
  });
  if (loadError !== null) return loadError;
  notFound();
}

export async function redirectReviewsIndex() {
  redirect("/issues");
}

export async function redirectReviewsPr({ n }: { n: string }) {
  const number = parsePrNumber(n);
  const resolved = number === null ? null : await port.resolvePr(number);
  if (number === null || resolved === null) {
    const loadError = await reviewLoadErrorView({
      title: reviewsCopy.metadata.reviewsMissing.title,
      description: reviewsCopy.metadata.reviewsMissing.description,
    });
    if (loadError !== null) return loadError;
    notFound();
  }
  redirect(redirectPathForPr(resolved.issueNumber, number));
}

export async function redirectReviewsPrRun({
  n,
  id,
}: {
  n: string;
  id: string;
}) {
  const number = parsePrNumber(n);
  const resolved = number === null ? null : await port.resolvePr(number);
  if (number === null || resolved === null || !resolved.runIds.includes(id)) {
    const loadError = await reviewLoadErrorView({
      title: reviewsCopy.metadata.reviewsMissing.title,
      description: reviewsCopy.metadata.reviewsMissing.description,
    });
    if (loadError !== null) return loadError;
    notFound();
  }
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
