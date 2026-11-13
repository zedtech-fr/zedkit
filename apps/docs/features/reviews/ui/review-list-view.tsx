"use client";

import { useEffect, useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Badge,
  EmptyState,
  Heading,
  PageHeader,
  Stack,
  Surface,
  Text,
  UpdatedAgo,
  formatDuration,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { githubIssueHref, githubPullHref } from "../model/github-hrefs";
import { issueOpenTarget } from "../model/issue-open-target";
import {
  entriesNewestFirst,
  headlineOutcome,
  latestEntry,
  latestFinishedEntry,
  summedDurationMs,
} from "../model/latest-status";
import { uniqueRunIds } from "../model/review-routes";
import type { IssueRecord, TimelineEntry, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { OutcomeMark } from "./issue-status";
import { CompactLogLink, TimelineRow } from "./review-timeline-row";

function runCountLabel(count: number, copy: ReviewsCopy): string {
  return `${count} ${count === 1 ? copy.list.run : copy.list.runs}`;
}

function RowSummary({
  title,
  meta,
}: {
  title: ReactNode;
  meta: ReactNode;
}) {
  return (
    <summary className="flex min-h-target cursor-pointer list-none items-start justify-between gap-stack-sm py-row focus-ring-control [&::-webkit-details-marker]:hidden">
      <Stack
        direction="horizontal"
        gap="sm"
        className="content-shrink flex-1 flex-wrap items-center max-md:flex-col max-md:items-stretch"
      >
        <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
          {title}
        </Stack>
        <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
          {meta}
        </Stack>
      </Stack>
      <ChevronDown
        aria-hidden="true"
        className="size-icon shrink-0 pt-step text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
      />
    </summary>
  );
}

function GithubRefLink({ href, copy, children }: { href: string; copy: ReviewsCopy; children: ReactNode }) {
  return (
    <CompactLogLink href={href} copy={copy}>
      {children}
    </CompactLogLink>
  );
}

function PanelOutcome({
  entries,
  links,
  copy,
}: {
  entries: readonly TimelineEntry[];
  links: ReactNode;
  copy: ReviewsCopy;
}) {
  const outcome = headlineOutcome(entries);
  const durationMs = summedDurationMs(entries);
  const finished = latestFinishedEntry(entries);
  return (
    <Stack gap="sm">
      {outcome ? (
        <Stack className="w-fit self-start">
          <OutcomeMark outcome={outcome} copy={copy} />
        </Stack>
      ) : null}
      <Stack
        direction="horizontal"
        gap="sm"
        className="flex-wrap items-center max-md:flex-col max-md:items-start"
      >
        {durationMs !== null ? (
          <Text variant="muted" typeRole="caption" className="whitespace-nowrap">
            {`${copy.list.took} ${formatDuration(durationMs)}`}
          </Text>
        ) : null}
        {finished ? (
          <UpdatedAgo
            date={new Date(finished.endedAt ?? finished.startedAt)}
            prefix={copy.list.finished}
            className="whitespace-nowrap"
          />
        ) : null}
      </Stack>
      {links}
    </Stack>
  );
}

function StepsPanel({
  entries,
  links,
  empty,
  copy,
}: {
  entries: readonly TimelineEntry[];
  links: ReactNode;
  empty: string;
  copy: ReviewsCopy;
}) {
  return (
    <Surface variant="solid" elevation={1} radius="md" padding="sm" className="mb-stack">
      <Stack gap="sm">
        <PanelOutcome entries={entries} links={links} copy={copy} />
        {entries.length === 0 ? (
          <EmptyState description={empty} />
        ) : (
          <ul aria-label={copy.issue.timeline} className="border-s border-border pl-control-inline">
            {entriesNewestFirst(entries).map((entry) => (
              <li key={entry.id} className="last:[&>*]:border-b-0">
                <TimelineRow entry={entry} href={entry.liveUrl} copy={copy} />
              </li>
            ))}
          </ul>
        )}
      </Stack>
    </Surface>
  );
}

function IssueRow({ issue, copy }: { issue: IssueRecord; copy: ReviewsCopy }) {
  const outcome = headlineOutcome(issue.entries);
  const finished = latestFinishedEntry(issue.entries);
  return (
    <details data-issues-row="" id={`issue-${issue.number}`} className="group border-b border-border open:border-b-0">
      <RowSummary
        title={
          <Text className="font-medium">
            #{issue.number} {issue.title}
          </Text>
        }
        meta={
          <>
            <Badge variant="outline">{copy.state[issue.state]}</Badge>
            {outcome ? <OutcomeMark outcome={outcome} copy={copy} /> : null}
            {finished ? (
              <UpdatedAgo
                date={new Date(finished.endedAt ?? finished.startedAt)}
                prefix={copy.list.finished}
                className="whitespace-nowrap"
              />
            ) : null}
          </>
        }
      />
      <StepsPanel
        entries={issue.entries}
        links={
          <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
            <GithubRefLink href={githubIssueHref(issue.number)} copy={copy}>
              {`${copy.list.githubIssue} #${issue.number}`}
            </GithubRefLink>
            {issue.pullRequests.map((n) => (
              <GithubRefLink key={n} href={githubPullHref(n)} copy={copy}>
                {`${copy.list.githubPull} #${n}`}
              </GithubRefLink>
            ))}
          </Stack>
        }
        empty={copy.issue.timelineEmpty}
        copy={copy}
      />
    </details>
  );
}

function UnlinkedRow({
  entry,
  copy,
}: {
  entry: UnlinkedPullRequest;
  copy: ReviewsCopy;
}) {
  const outcome = headlineOutcome(entry.entries);
  const last = latestEntry(entry.entries);
  const finished = latestFinishedEntry(entry.entries);
  const runCount = uniqueRunIds(entry.entries.map((item) => item.runId)).length;
  return (
    <details data-issues-row="" id={`pr-${entry.number}`} className="group border-b border-border open:border-b-0">
      <RowSummary
        title={<Text className="font-medium">#{entry.number}</Text>}
        meta={
          <>
            {last ? (
              <Text variant="muted" typeRole="caption">
                {copy.type[last.type]}
              </Text>
            ) : null}
            {outcome ? <OutcomeMark outcome={outcome} copy={copy} /> : null}
            <Text variant="muted" typeRole="caption">
              {runCountLabel(runCount, copy)}
            </Text>
            {finished ? (
              <UpdatedAgo
                date={new Date(finished.endedAt ?? finished.startedAt)}
                prefix={copy.list.finished}
                className="whitespace-nowrap"
              />
            ) : null}
          </>
        }
      />
      <StepsPanel
        entries={entry.entries}
        links={
          <GithubRefLink href={githubPullHref(entry.number)} copy={copy}>
            {`${copy.list.githubPull} #${entry.number}`}
          </GithubRefLink>
        }
        empty={copy.unlinked.timelineEmpty}
        copy={copy}
      />
    </details>
  );
}

export function ReviewListView({
  issues,
  unlinked,
  copy,
}: {
  issues: readonly IssueRecord[];
  unlinked: readonly UnlinkedPullRequest[];
  copy: ReviewsCopy;
}) {
  const unlinkedHeadingId = useId();
  useEffect(() => {
    const apply = () => {
      const target = issueOpenTarget(window.location.search, window.location.hash);
      if (target === null) return;
      const rows = document.querySelectorAll("main details[data-issues-row]");
      const el =
        target === "first" ? rows[0] : document.getElementById(target);
      if (!(el instanceof HTMLDetailsElement)) return;
      for (const row of rows) {
        if (row instanceof HTMLDetailsElement && row !== el) row.open = false;
      }
      el.open = true;
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  return (
    <ReviewAppearanceFrame>
      <PageHeader title={copy.list.title} description={copy.list.description} />
      {issues.length === 0 && unlinked.length === 0 ? (
        <EmptyState description={copy.list.empty} />
      ) : issues.length === 0 ? null : (
        <ul aria-label={copy.list.title}>
          {issues.map((issue) => (
            <li key={issue.number}>
              <IssueRow issue={issue} copy={copy} />
            </li>
          ))}
        </ul>
      )}
      {unlinked.length > 0 ? (
        <Stack gap="sm">
          <Heading level={2} typeRole="section" id={unlinkedHeadingId}>
            {copy.list.unlinkedTitle}
          </Heading>
          <Text variant="muted">{copy.list.unlinkedDescription}</Text>
          <ul aria-labelledby={unlinkedHeadingId}>
            {unlinked.map((entry) => (
              <li key={entry.number}>
                <UnlinkedRow entry={entry} copy={copy} />
              </li>
            ))}
          </ul>
        </Stack>
      ) : null}
    </ReviewAppearanceFrame>
  );
}
