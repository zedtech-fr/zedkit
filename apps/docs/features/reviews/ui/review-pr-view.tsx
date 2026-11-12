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
  formatDuration,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { issueRunPath, unlinkedRunPath } from "../model/review-routes";
import type { IssueRecord, TimelineEntry, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { LatestStatusMark } from "./issue-status";
import { ReviewSampleNotice } from "./review-sample-notice";

function TimelineRow({
  entry,
  href,
  copy,
}: {
  entry: TimelineEntry;
  href: string;
  copy: ReviewsCopy;
}) {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-center border-b border-border py-row">
      <Button asChild variant="link" className="min-h-target w-fit">
        <Link href={href}>
          {copy.type[entry.type]}
        </Link>
      </Button>
      {entry.verdict !== null ? (
        <LatestStatusMark status={entry.verdict} copy={copy} />
      ) : (
        <LatestStatusMark status={entry.status} copy={copy} />
      )}
      {entry.models.length > 0 ? (
        <Text variant="muted" typeRole="caption">
          {entry.models.join(", ")}
        </Text>
      ) : null}
      {entry.durationMs !== null ? (
        <Text variant="muted" typeRole="caption">
          {formatDuration(entry.durationMs)}
        </Text>
      ) : null}
      <UpdatedAgo date={new Date(entry.startedAt)} />
    </Stack>
  );
}

function Timeline({
  entries,
  hrefFor,
  copy,
  empty,
}: {
  entries: readonly TimelineEntry[];
  hrefFor: (entry: TimelineEntry) => string;
  copy: ReviewsCopy;
  empty: string;
}) {
  const headingId = useId();
  return (
    <Stack gap="sm">
      <Heading level={2} typeRole="section" id={headingId}>
        {copy.issue.timeline}
      </Heading>
      {entries.length === 0 ? (
        <EmptyState description={empty} />
      ) : (
        <ul aria-labelledby={headingId}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <TimelineRow entry={entry} href={hrefFor(entry)} copy={copy} />
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}

export function ReviewPrView({
  issue,
  copy,
  showSampleNotice = false,
}: {
  issue: IssueRecord;
  copy: ReviewsCopy;
  showSampleNotice?: boolean;
}) {
  return (
    <ReviewAppearanceFrame>
      {showSampleNotice ? <ReviewSampleNotice copy={copy} /> : null}
      <PageHeader
        title={`#${issue.number} ${issue.title}`}
        back={
          <Button asChild variant="link" size="sm" className="min-h-target">
            <Link href="/issues">{copy.issue.back}</Link>
          </Button>
        }
      />
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Badge variant="outline">{copy.state[issue.state]}</Badge>
        {issue.pullRequests.length > 0 ? (
          <Text variant="muted" typeRole="caption">
            {`${issue.pullRequests.length === 1 ? copy.list.linkedPr : copy.list.linkedPrs} ${issue.pullRequests
              .map((n) => `#${n}`)
              .join(", ")}`}
          </Text>
        ) : null}
      </Stack>
      <Timeline
        entries={issue.entries}
        hrefFor={(entry) => issueRunPath(issue.number, entry.runId)}
        copy={copy}
        empty={copy.issue.timelineEmpty}
      />
    </ReviewAppearanceFrame>
  );
}

export function UnlinkedPrView({
  pullRequest,
  copy,
  showSampleNotice = false,
}: {
  pullRequest: UnlinkedPullRequest;
  copy: ReviewsCopy;
  showSampleNotice?: boolean;
}) {
  return (
    <ReviewAppearanceFrame>
      {showSampleNotice ? <ReviewSampleNotice copy={copy} /> : null}
      <PageHeader
        title={`${copy.unlinked.title} #${pullRequest.number}`}
        back={
          <Button asChild variant="link" size="sm" className="min-h-target">
            <Link href="/issues">{copy.unlinked.back}</Link>
          </Button>
        }
      />
      <Timeline
        entries={pullRequest.entries}
        hrefFor={(entry) => unlinkedRunPath(pullRequest.number, entry.runId)}
        copy={copy}
        empty={copy.unlinked.timelineEmpty}
      />
    </ReviewAppearanceFrame>
  );
}
