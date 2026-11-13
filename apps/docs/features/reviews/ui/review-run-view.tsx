"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  PageHeader,
  Stack,
  Text,
  UpdatedAgo,
  formatDuration,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { issuePath, unlinkedPrPath } from "../model/review-routes";
import type { IssueRecord, RunRecord, UnlinkedPullRequest } from "../ports/review-port";
import { ReviewAppearanceFrame } from "./appearance-panel";
import { LatestStatusMark } from "./issue-status";

function RunBody({
  run,
  copy,
}: {
  run: RunRecord;
  copy: ReviewsCopy;
}) {
  const types = [...new Set(run.entries.map((entry) => entry.type))];
  return (
    <Stack gap="md">
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        {types.map((type) => (
          <Badge key={type} variant="outline">
            {copy.type[type]}
          </Badge>
        ))}
        {run.verdict !== null ? (
          <LatestStatusMark status={run.verdict} copy={copy} />
        ) : (
          <LatestStatusMark status={run.status} copy={copy} />
        )}
        {run.models.length > 0 ? (
          <Text variant="muted" typeRole="caption">
            {run.models.join(", ")}
          </Text>
        ) : null}
        {run.durationMs !== null ? (
          <Text variant="muted" typeRole="caption">
            {formatDuration(run.durationMs)}
          </Text>
        ) : null}
        <UpdatedAgo date={new Date(run.startedAt)} />
      </Stack>
      {run.liveUrl !== null ? (
        <Button asChild className="min-h-target w-fit">
          <a href={run.liveUrl} target="_blank" rel="noreferrer">
            {copy.run.openLive}
          </a>
        </Button>
      ) : (
        <Text variant="muted">{copy.run.noLive}</Text>
      )}
    </Stack>
  );
}

export function ReviewRunView({
  issue,
  run,
  copy,
}: {
  issue: IssueRecord;
  run: RunRecord;
  copy: ReviewsCopy;
}) {
  return (
    <ReviewAppearanceFrame>
      <PageHeader
        title={`${copy.run.title} ${run.runId}`}
        description={`#${issue.number} ${issue.title}`}
        back={
          <Stack direction="horizontal" gap="sm" className="flex-wrap">
            <Button asChild variant="link" size="sm" className="min-h-target">
              <Link href={issuePath(issue.number)}>{copy.run.backToIssue}</Link>
            </Button>
            <Button asChild variant="link" size="sm" className="min-h-target">
              <Link href="/issues">{copy.run.backToList}</Link>
            </Button>
          </Stack>
        }
      />
      <RunBody run={run} copy={copy} />
    </ReviewAppearanceFrame>
  );
}

export function UnlinkedRunView({
  pullRequest,
  run,
  copy,
}: {
  pullRequest: UnlinkedPullRequest;
  run: RunRecord;
  copy: ReviewsCopy;
}) {
  return (
    <ReviewAppearanceFrame>
      <PageHeader
        title={`${copy.run.title} ${run.runId}`}
        description={`${copy.unlinked.title} #${pullRequest.number}`}
        back={
          <Stack direction="horizontal" gap="sm" className="flex-wrap">
            <Button asChild variant="link" size="sm" className="min-h-target">
              <Link href={unlinkedPrPath(pullRequest.number)}>{copy.run.backToUnlinked}</Link>
            </Button>
            <Button asChild variant="link" size="sm" className="min-h-target">
              <Link href="/issues">{copy.run.backToList}</Link>
            </Button>
          </Stack>
        }
      />
      <RunBody run={run} copy={copy} />
    </ReviewAppearanceFrame>
  );
}
