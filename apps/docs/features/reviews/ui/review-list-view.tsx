"use client";

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
import { issuePath, unlinkedPrPath } from "../model/review-routes";
import type { IssueRecord, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { LatestStatusMark } from "./issue-status";

function linkedPrLabel(count: number, copy: ReviewsCopy): string {
  return count === 1 ? copy.list.linkedPr : copy.list.linkedPrs;
}

function IssueRow({ issue, copy }: { issue: IssueRecord; copy: ReviewsCopy }) {
  const status = latestStatus(issue.entries);
  return (
    <Stack gap="sm" className="border-b border-border py-section-sm">
      <Button asChild variant="link" className="min-h-target w-fit">
        <Link href={issuePath(issue.number)}>
          #{issue.number} {issue.title}
        </Link>
      </Button>
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
  return (
    <Stack gap="sm" className="border-b border-border py-section-sm">
      <Button asChild variant="link" className="min-h-target w-fit">
        <Link href={unlinkedPrPath(entry.number)} aria-label={`${copy.list.openUnlinked} #${entry.number}`}>
          #{entry.number}
        </Link>
      </Button>
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        {last ? (
          <Text variant="muted" typeRole="caption">
            {copy.type[last.type]}
          </Text>
        ) : null}
        {status ? <LatestStatusMark status={status} copy={copy} /> : null}
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
  return (
    <ReviewAppearanceFrame copy={copy}>
      {(panel) => (
        <>
          <PageHeader title={copy.list.title} description={copy.list.description} />
          {panel}
          {issues.length === 0 ? (
            <EmptyState description={copy.list.empty} />
          ) : (
            <ul>
              {issues.map((issue) => (
                <li key={issue.number}>
                  <IssueRow issue={issue} copy={copy} />
                </li>
              ))}
            </ul>
          )}
          {unlinked.length > 0 ? (
            <Stack gap="sm">
              <Heading level={2} typeRole="section">
                {copy.list.unlinkedTitle}
              </Heading>
              <Text variant="muted">{copy.list.unlinkedDescription}</Text>
              <ul>
                {unlinked.map((entry) => (
                  <li key={entry.number}>
                    <UnlinkedRow entry={entry} copy={copy} />
                  </li>
                ))}
              </ul>
            </Stack>
          ) : null}
        </>
      )}
    </ReviewAppearanceFrame>
  );
}
