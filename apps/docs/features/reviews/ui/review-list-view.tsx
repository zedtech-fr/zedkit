"use client";

import { useId } from "react";
import Link from "next/link";
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
import {
  issuePath,
  issueRunPath,
  uniqueRunIds,
  unlinkedPrPath,
  unlinkedRunPath,
} from "../model/review-routes";
import type { IssueRecord, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { LatestStatusMark } from "./issue-status";

function linkedPrLabel(count: number, copy: ReviewsCopy): string {
  return count === 1 ? copy.list.linkedPr : copy.list.linkedPrs;
}

function runCountLabel(count: number, copy: ReviewsCopy): string {
  return `${count} ${count === 1 ? copy.list.run : copy.list.runs}`;
}

function IssueRow({ issue, copy }: { issue: IssueRecord; copy: ReviewsCopy }) {
  const status = latestStatus(issue.entries);
  const last = latestEntry(issue.entries);
  return (
    <Stack gap="sm" className="border-b border-border py-section-sm">
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Button asChild variant="link" className="min-h-target w-fit">
          <Link href={last ? issueRunPath(issue.number, last.runId) : issuePath(issue.number)}>
            #{issue.number} {issue.title}
          </Link>
        </Button>
        {last ? (
          <Button asChild variant="link" className="min-h-target w-fit">
            <Link href={issuePath(issue.number)}>{copy.issue.timeline}</Link>
          </Button>
        ) : null}
      </Stack>
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
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
      </Stack>
    </Stack>
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
    <Stack gap="sm" className="border-b border-border py-section-sm">
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Button asChild variant="link" className="min-h-target w-fit">
          <Link href={last ? unlinkedRunPath(entry.number, last.runId) : unlinkedPrPath(entry.number)}>
            #{entry.number}
          </Link>
        </Button>
        {last ? (
          <Button asChild variant="link" className="min-h-target w-fit">
            <Link href={unlinkedPrPath(entry.number)}>{copy.issue.timeline}</Link>
          </Button>
        ) : null}
      </Stack>
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
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
      </Stack>
    </Stack>
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
      {issues.length === 0 ? (
        <EmptyState description={copy.list.empty} />
      ) : (
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
