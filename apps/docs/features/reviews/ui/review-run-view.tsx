"use client";

/**
 * Métier: zedkit publishes a public TypeScript UI/AI kit and a docs site.
 * Client personas: integrating developers evaluating the kit; maintainers filing visual bugs.
 * Customers: app teams who install @zedtech/zedkit-* or copy UI via the registry.
 * Customer personas: hurried visitor on a phone scanning a public run; maintainer reproducing a look via share link.
 * UI decisions:
 * - Run summary on a hairline Surface (elevation 0, page fill, 12px radius) — because: a hurried visitor reads on a white page; foundations cards have no rest shadow and no Glass sheen.
 * - Hosted-console control is a site action — because: indigo is kit Glass primary and must not compete with the content on this page.
 * - liveUrl stays an outbound link; missing URL keeps muted copy inside the same panel — because: this is not a second console, and the page still resolves.
 * - No identity form on this view — because: the dock owns look customization.
 */

import Link from "next/link";
import {
  Badge,
  Button,
  PageHeader,
  Stack,
  Surface,
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
    <Surface elevation={0} radius="xl" padding="card" className="bg-background">
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
          <Button asChild data-site-action="" className="min-h-target w-fit">
            <a href={run.liveUrl} target="_blank" rel="noreferrer">
              {copy.run.openLive}
            </a>
          </Button>
        ) : (
          <Text variant="muted">{copy.run.noLive}</Text>
        )}
      </Stack>
    </Surface>
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
