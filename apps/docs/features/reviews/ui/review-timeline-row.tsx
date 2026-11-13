"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Button, Stack, Text, UpdatedAgo, formatDuration } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { displayModelLabels } from "../model/display-model";
import { entryUpdatedAt } from "../model/latest-status";
import type { TimelineEntry } from "../ports/review-port";
import { LatestStatusMark } from "./issue-status";

const compactLinkClass =
  "hit-target inline-flex w-fit items-center gap-icon text-dense text-info link-offset hover:underline focus-ring";

const rowClass = "border-b border-border py-row";

const logCellClass =
  "block cursor-pointer rounded-md border-b border-border py-row text-foreground no-underline hover:bg-muted hover:no-underline focus-ring-control active:bg-secondary";

export function CompactLogLink({
  href,
  copy,
  children,
}: {
  href: string;
  copy: ReviewsCopy;
  children: ReactNode;
}) {
  const opens = copy.list.opensInNewTab;
  const external = href.startsWith("https:");
  const mark = external ? (
    <>
      <ExternalLink aria-hidden="true" className="size-icon shrink-0" />
      <Text as="span" className="sr-only">
        {` (${opens})`}
      </Text>
    </>
  ) : null;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={compactLinkClass}>
        {children}
        {mark}
      </a>
    );
  }
  return (
    <Link href={href} className={compactLinkClass}>
      {children}
    </Link>
  );
}

function replacementCopy(entry: TimelineEntry, copy: ReviewsCopy): string | null {
  if (entry.superseded !== true) return null;
  return entry.status === "failed" ? copy.issue.failedReplaced : copy.issue.replaced;
}

function TimelineRowLink({
  href,
  copy,
  children,
}: {
  href: string;
  copy: ReviewsCopy;
  children: ReactNode;
}) {
  const opens = copy.list.opensInNewTab;
  if (href.startsWith("https:")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={logCellClass}>
        {children}
        <Text as="span" className="sr-only">
          {` (${opens})`}
        </Text>
      </a>
    );
  }
  return (
    <Link href={href} className={logCellClass}>
      {children}
    </Link>
  );
}

function ViewLogAffordance({ copy }: { copy: ReviewsCopy }) {
  return (
    <Button asChild variant="secondary" size="sm" className="text-dense">
      <Text as="span">
        {copy.issue.viewLog}
        <ChevronRight aria-hidden="true" />
      </Text>
    </Button>
  );
}

function TimelineRowBody({
  entry,
  copy,
  log,
  className,
}: {
  entry: TimelineEntry;
  copy: ReviewsCopy;
  log: boolean;
  className?: string | undefined;
}) {
  const label = copy.type[entry.type];
  const replacement = replacementCopy(entry, copy);
  const models = displayModelLabels(entry.models);
  const showStatus =
    entry.verdict === null && replacement === null && (entry.status === "running" || entry.status === "failed");
  const finishedPrefix = entry.status === "running" ? undefined : copy.list.finished;

  return (
    <Stack gap="tight" className={className}>
      <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
        <Text className="font-medium">{label}</Text>
        {entry.verdict !== null ? (
          <LatestStatusMark status={entry.verdict} copy={copy} score={entry.score ?? null} />
        ) : null}
        {showStatus ? <LatestStatusMark status={entry.status} copy={copy} /> : null}
        {replacement ? (
          <Text variant="muted" typeRole="caption">
            {replacement}
          </Text>
        ) : null}
      </Stack>
      {models !== "" ? (
        <Text variant="muted" typeRole="caption" className="max-md:max-w-full">
          {models}
        </Text>
      ) : null}
      <Stack
        direction="horizontal"
        gap="sm"
        className="flex-wrap items-center max-md:flex-col max-md:items-start"
      >
        {entry.durationMs !== null ? (
          <Text variant="muted" typeRole="caption" className="whitespace-nowrap">
            {`${copy.list.took} ${formatDuration(entry.durationMs)}`}
          </Text>
        ) : null}
        <UpdatedAgo
          date={new Date(entryUpdatedAt(entry))}
          {...(finishedPrefix === undefined ? {} : { prefix: finishedPrefix })}
          className="whitespace-nowrap"
        />
        {log ? <ViewLogAffordance copy={copy} /> : null}
      </Stack>
    </Stack>
  );
}

export function TimelineRow({
  entry,
  href,
  copy,
}: {
  entry: TimelineEntry;
  href: string | null;
  copy: ReviewsCopy;
}) {
  if (href === null) {
    return <TimelineRowBody entry={entry} copy={copy} log={false} className={rowClass} />;
  }
  return (
    <TimelineRowLink href={href} copy={copy}>
      <TimelineRowBody entry={entry} copy={copy} log />
    </TimelineRowLink>
  );
}
