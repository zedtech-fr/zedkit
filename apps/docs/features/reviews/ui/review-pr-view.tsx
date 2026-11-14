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
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { issueFullTitle } from "../model/github-hrefs";
import type { IssueRecord, TimelineEntry, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { TimelineRow } from "./review-timeline-row";
import { DetailMeta } from "./review-issue-detail";

function Timeline({
  entries,
  copy,
  empty,
}: {
  entries: readonly TimelineEntry[];
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
        <ul aria-labelledby={headingId} className="flex list-none flex-col gap-stack-sm">
          {entries.map((entry) => (
            <li key={entry.id}>
              <TimelineRow entry={entry} href={entry.liveUrl} copy={copy} />
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
}: {
  issue: IssueRecord;
  copy: ReviewsCopy;
}) {
  return (
    <ReviewAppearanceFrame>
      <PageHeader
        title={issueFullTitle(issue)}
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
      <DetailMeta
        entries={issue.entries}
        links={[{ kind: "issue", n: issue.number }, ...issue.pullRequests.map((n) => ({ kind: "pr" as const, n }))]}
        copy={copy}
      />
      <Timeline entries={issue.entries} copy={copy} empty={copy.issue.timelineEmpty} />
    </ReviewAppearanceFrame>
  );
}

export function UnlinkedPrView({
  pullRequest,
  copy,
}: {
  pullRequest: UnlinkedPullRequest;
  copy: ReviewsCopy;
}) {
  return (
    <ReviewAppearanceFrame>
      <PageHeader
        title={`${copy.unlinked.title} #${pullRequest.number}`}
        back={
          <Button asChild variant="link" size="sm" className="min-h-target">
            <Link href="/issues">{copy.unlinked.back}</Link>
          </Button>
        }
      />
      <DetailMeta
        entries={pullRequest.entries}
        links={[{ kind: "pr", n: pullRequest.number }]}
        copy={copy}
      />
      <Timeline
        entries={pullRequest.entries}
        copy={copy}
        empty={copy.unlinked.timelineEmpty}
      />
    </ReviewAppearanceFrame>
  );
}
