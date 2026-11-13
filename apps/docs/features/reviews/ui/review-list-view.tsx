"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Heading,
  PageHeader,
  Stack,
  Text,
  UpdatedAgo,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { latestEntry, latestStatus } from "../model/latest-status";
import { issuePath, uniqueRunIds, unlinkedPrPath } from "../model/review-routes";
import type { IssueRecord, TimelineEntry, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { LatestStatusMark } from "./issue-status";
import { TimelineRow } from "./review-timeline-row";

function linkedPrLabel(count: number, copy: ReviewsCopy): string {
  return count === 1 ? copy.list.linkedPr : copy.list.linkedPrs;
}

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
    <summary className="flex min-h-target cursor-pointer list-none items-center justify-between gap-stack-sm py-row focus-ring-control [&::-webkit-details-marker]:hidden">
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
        className="size-icon shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
      />
    </summary>
  );
}

function StepsPanel({
  entries,
  timelineHref,
  timelineLabel,
  empty,
  copy,
}: {
  entries: readonly TimelineEntry[];
  timelineHref: string;
  timelineLabel: string;
  empty: string;
  copy: ReviewsCopy;
}) {
  return (
    <Stack gap="sm" className="pl-control-inline">
      {entries.length === 0 ? (
        <EmptyState description={empty} />
      ) : (
        <ul aria-label={copy.issue.timeline}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <TimelineRow entry={entry} href={entry.liveUrl} copy={copy} />
            </li>
          ))}
        </ul>
      )}
      <Button asChild variant="link" className="min-h-target w-fit">
        <Link href={timelineHref}>{timelineLabel}</Link>
      </Button>
    </Stack>
  );
}

function IssueRow({ issue, copy }: { issue: IssueRecord; copy: ReviewsCopy }) {
  const status = latestStatus(issue.entries);
  return (
    <details data-issues-row="" id={`issue-${issue.number}`} className="group border-b border-border">
      <RowSummary
        title={
          <Text className="font-medium">
            #{issue.number} {issue.title}
          </Text>
        }
        meta={
          <>
            <Badge variant="outline">{copy.state[issue.state]}</Badge>
            {status ? <LatestStatusMark status={status} copy={copy} /> : null}
            {issue.pullRequests.length > 0 ? (
              <Text variant="muted" typeRole="caption">
                {`${linkedPrLabel(issue.pullRequests.length, copy)} ${issue.pullRequests
                  .map((n) => `#${n}`)
                  .join(", ")}`}
              </Text>
            ) : null}
            <UpdatedAgo date={new Date(issue.lastRunAt)} />
          </>
        }
      />
      <StepsPanel
        entries={issue.entries}
        timelineHref={issuePath(issue.number)}
        timelineLabel={copy.issue.timeline}
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
  const status = latestStatus(entry.entries);
  const last = latestEntry(entry.entries);
  const runCount = uniqueRunIds(entry.entries.map((item) => item.runId)).length;
  return (
    <details data-issues-row="" id={`pr-${entry.number}`} className="group border-b border-border">
      <RowSummary
        title={<Text className="font-medium">#{entry.number}</Text>}
        meta={
          <>
            {last ? (
              <Text variant="muted" typeRole="caption">
                {copy.type[last.type]}
              </Text>
            ) : null}
            {status ? <LatestStatusMark status={status} copy={copy} /> : null}
            <Text variant="muted" typeRole="caption">
              {runCountLabel(runCount, copy)}
            </Text>
            <UpdatedAgo date={new Date(entry.lastRunAt)} />
          </>
        }
      />
      <StepsPanel
        entries={entry.entries}
        timelineHref={unlinkedPrPath(entry.number)}
        timelineLabel={copy.issue.timeline}
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
