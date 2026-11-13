/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning real issue work; maintainer reproducing a look via share link.
 * UI decisions:
 * - Desktop `/issues` is a master-detail workspace (`aside` list + `article` detail) inside the 1400px header column — because: a hurried visitor at 1440 must see one selected run and the rest of the log without a centered accordion and empty side margins. Compose kit AppShell tokens (`w-app-shell-sidebar`, muted wash, shell padding) plus `SidebarNavItem` / `SidebarNavGroup`; do not mount AppShell (it would nest a second `main`). StickyAside is not used: it only internally scrolls the aside.
 * - List rows are kit `SidebarNavItem` hash links (`#issue-N` / `#pr-N`) with `StatusDot`, title, and one chip when present (headline outcome, else issue state; unlinked rows with no outcome show type and run count only); selected row is `aria-current="page"` plus muted wash — because: the live console already uses that nav primitive, and the visitor must know which run is open. Relative time lives on the detail, not the row (the 16rem aside overflows). No nested links. Accessible name is the visible title plus the trail so the aria-hidden kit trail is still announced; the visible title stays in that name (WCAG 2.5.3).
 * - Detail header is kit `Card` (same shell as the console decision band) with title, state, outcome, and a DetailPanel grid (Duration when present, Finished or Started, Issue, PR); steps are aligned rows with type, badge, model chip, time, and View log — because: the previous inline hairlines read as raw text. `liveUrl` stays View log. No Timeline button — `/issues/N` stays for bookmarks.
 * - First item is selected by default; `?open=first` / `#first` / `#issue-N` / `#pr-N` still apply — because: desktop must show a run immediately, and the home illustration link plus deep links must keep working. A well-formed hash that is not on the list keeps the URL and shows `copy.list.missing` as an h2 that names the article; it must not silently open the first row. Static export cannot know the hash at bake time, so the first paint is the default row until the client hash effect runs. The aside (and drawer body) names the list; the inner list is kit `Stack` (not a `nav` landmark). A live region announces only the detail title. `scrollIntoView` runs only for a specific `#issue-n` / `#pr-n` on `md+`. The drawer title matches “Issue list”.
 * - Below `md` the list opens in a kit Drawer (same shape as AppShell) and the detail is the first screen — because: AppShell's breakpoint is `md`, and a hurried visitor on a phone must reach the selected run without a stacked list. Sidebar mounts twice (aside + drawer); ids stay on the aside only.
 * - Separate unlinked-PR block in the same aside — because: those runs must stay reachable without colliding with GitHub issue numbers.
 * - Public run history list matches the 1400px header column (`--zk-header-max-width`) — because: a hurried visitor at 1440 expects the Issues heading and rows to line up under the brand, not sit in a narrower 1200px well.
 * - `/issues` lists steps newest first (running, then `endedAt ?? startedAt`, then `id` descending) — because: hurried visitor sees the latest state without scrolling. Port `sortEntries` stays oldest-first.
 * - Headline is running, else a newest-finished failure, else the newest review verdict.
 * - `/issues/N` and `/issues/pr/:n` timelines stay chronological stacked rows with type, Badge meta models, duration, verdict/score, replacement copy — because: hurried visitor follows plan → implement → review → follow-up. Completed is not badged; only running, didn't-finish, and review verdicts are.
 * - Plan and implement are distinct rows even when they share a runId — because: they are separate phases of the work.
 * - Live-backed `/issues/N/runs/<id>` mounts the shared kit console — because: hurried visitor reads the recorded run in the shared shell.
 * - Index-only `/issues/N/runs/<id>` (and unlinked run URLs) redirect to the allowlisted hosted-console href, or to the issue / unlinked page when that href is missing — because: bot comments still resolve, and the public runs API has no transcript to render here. Static export overwrites those HTML files with the same stub writer as `/reviews`.
 * - Appearance / ThemeScope frame stays as the page shell and an optional share-URL pin — because: a saved appearance query still reproduces a look; an empty query inherits the site so the dock is enough. Do not restore an inline form as a testing ground. The console uses `ReviewConsoleAppearanceFrame` (dense strip) only.
 * - Empty state says no public runs yet — because: the visitor always has a next thought.
 * - Load error uses the route PageHeader plus kit ErrorState with an All issues link and no Retry — because: a nested URL must not keep the list heading (WCAG 2.4.6), the HTML is baked at build time so a reload would serve the same page, and the visitor still needs a way off the dead-end.
 * - Not-found links back to /issues — because: a missing issue must not strand the visitor.
 * - List has no search or state/verdict filter — because: the public list is short enough to scan.
 * - List rows keep the visible title inside the accessible name and have no nested links — because: speech-control users say the title they see (WCAG 2.5.3).
 * - Console list rows use `SidebarNavItem` (`min-h-target`); timeline steps keep `py-row` — because: hurried visitors at 390px need scan rhythm, not section padding between rows.
 * - Views stay client components — because: the frame is a client component that reads the share URL on mount.
 * - Retired /reviews/pr/64|79|80 stubs are export-only; run-level retired URLs 404 — because: run ids are unknowable once retired.
 */

import { notFound, redirect } from "next/navigation";

import { createSiteReviewPort } from "./adapters/live";
import { reviewsCopy } from "./i18n/reviews-copy";
import { parsePrNumber } from "./model/pr-number";
import {
  issueIndexRobotsFrom,
  issuePath,
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
  runRedirectTarget,
  unlinkedPrPath,
} from "./model/review-routes";
import { toAgentConsole } from "./model/to-agent-console";
import { isRunRecord } from "./ports/review-port";
import { ReviewConsoleView } from "./ui/review-console-view";
import { ReviewLoadErrorView } from "./ui/review-load-error-view";
import { ReviewNotFoundView } from "./ui/review-not-found-view";
import { ReviewListView } from "./ui/review-list-view";
import { ReviewPrView, UnlinkedPrView } from "./ui/review-pr-view";

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
    redirect(runRedirectTarget(run.liveUrl, issuePath(issue.number)));
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
    redirect(runRedirectTarget(run.liveUrl, unlinkedPrPath(pullRequest.number)));
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
