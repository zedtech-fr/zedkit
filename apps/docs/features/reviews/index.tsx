/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning real issue work; maintainer reproducing a look via share link.
 * UI decisions:
 * - Issue list at /issues with title, state, and latest review outcome first; each row is a native details accordion of that issue’s steps — because: hurried visitor reads every step inline without opening an empty run page.
 * - Accordion panel has compact Issue/PR links and step rows; no Timeline button — because: `/issues/N` stays for bookmarks, and a second page of the same steps is redundant.
 * - Separate unlinked-PR block — because: those runs must stay reachable without colliding with GitHub issue numbers.
 * - Public run history list matches the 1400px header column (`--zk-header-max-width`) — because: a hurried visitor at 1440 expects the Issues heading and rows to line up under the brand, not sit in a narrower 1200px well.
 * - Issue and unlinked summary rows are two bands below md (title, then badges and date), one scan row from md — because: a hurried visitor on a phone scans one band per issue without chasing wrapped fragments. Accordion panels stay closed until opened. Chevron sits at the title top-right (`items-start`) so a tall wrapped title does not center it.
 * - `/issues` accordion lists steps newest first (running, then `endedAt ?? startedAt`, then `id` descending) — because: hurried visitor sees the latest state without scrolling. Port `sortEntries` stays oldest-first.
 * - Expanded panel is a solid Surface (elevation 1) with the latest outcome, total duration, finish time, and compact Issue/PR links — because: a visitor with no internal context should read the outcome in two seconds. Summary has no nested links and no GitHub issue/PR text (WCAG 2.5.3). Headline is running, else a newest-finished failure, else the newest review verdict.
 * - `/issues/N` and `/issues/pr/:n` timelines stay chronological stacked rows with type, muted models, duration, verdict/score, replacement copy — because: hurried visitor follows plan → implement → review → follow-up. Completed is not badged; only running, didn't-finish, and review verdicts are.
 * - Plan and implement are distinct rows even when they share a runId — because: they are separate phases of the work.
 * - `/issues/run?id=` and baked `/issues/N/runs/<id>` (and unlinked run URLs) mount the shared kit live console — because: hurried visitor reads the public run on zedkit, including runs created after the last static export.
 * - Appearance / ThemeScope frame stays as the page shell and an optional share-URL pin — because: a saved appearance query still reproduces a look; an empty query inherits the site (`html` `data-identity` from IdentityScript, `.dark` from the theme provider) so the dock is enough. Do not restore an inline form as a testing ground. The live console uses `ReviewConsoleAppearanceFrame` with no look-control strip.
 * - Each `TimelineRow` with a live URL is one in-page log link covering the cell, with a secondary View log Button — because: hurried visitor taps the step, not a body-text link. Issue/PR GitHub links stay in the panel header, not inside the cell.
 * - Empty state says no public runs yet — because: the visitor always has a next thought.
 * - Load error uses the route PageHeader plus kit ErrorState with an All issues link and no Retry — because: a nested URL must not keep the list heading (WCAG 2.4.6), the HTML is baked at build time so a reload would serve the same page, and the visitor still needs a way off the dead-end.
 * - Not-found links back to /issues — because: a missing issue must not strand the visitor.
 * - List has no search or state/verdict filter — because: the public list is short enough to scan.
 * - List summaries use the visible title as the accessible name; no extra aria-label and no nested links in the summary — because: speech-control users say the title they see (WCAG 2.5.3).
 * - List and timeline rows use py-row — because: hurried visitors at 390px need scan rhythm, not section padding between rows.
 * - Views stay client components — because: the frame is a client component that reads the share URL on mount.
 * - Retired /reviews/pr/64|79|80 stubs are export-only; run-level retired URLs 404 — because: run ids are unknowable once retired.
 */

import { notFound, redirect } from "next/navigation";

import { createSiteReviewPort } from "./adapters/live";
import { liveRunsApiBase } from "./adapters/live-run-api";
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
import { isRunRecord } from "./ports/review-port";
import { ReviewLiveConsole, ReviewLiveConsoleFromSearch } from "./compose";
import { ReviewLoadErrorView } from "./ui/review-load-error-view";
import { ReviewNotFoundView } from "./ui/review-not-found-view";
import { ReviewListView } from "./ui/review-list-view";
import { ReviewPrView, UnlinkedPrView } from "./ui/review-pr-view";

const port = createSiteReviewPort();
const runsBase = liveRunsApiBase();

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
  return (
    <ReviewLiveConsole
      runId={id}
      issueNumber={issue.number}
      initial={isRunRecord(run) ? null : run}
      runsBase={runsBase}
    />
  );
}

export function ReviewLiveConsoleSearchFeature() {
  return <ReviewLiveConsoleFromSearch runsBase={runsBase} />;
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
    return <ReviewLiveConsole runId={id} unlinkedPr={pullRequest.number} runsBase={runsBase} />;
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
export { liveConsoleCopy } from "./i18n/review-live-console-copy";
