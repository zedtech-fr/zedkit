"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Badge, Button, Stack, Text, UpdatedAgo, formatDuration } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { displayModelLabels } from "../model/display-model";
import { entryUpdatedAt } from "../model/latest-status";
import type { TimelineEntry } from "../ports/review-port";
import { LatestStatusMark } from "./issue-status";

const compactLinkClass =
  "hit-target inline-flex w-fit shrink-0 items-center gap-icon text-dense text-info link-offset hover:underline focus-ring";

const logCellClass =
  "block py-row text-foreground no-underline hover:bg-muted hover:no-underline focus-ring-control active:bg-secondary active:text-secondary-foreground";

const rowLayout =
  "items-start justify-between py-row max-md:flex-col max-md:items-stretch";

export function CompactLogLink({
  href,
  copy,
  children,
  className,
}: {
  href: string;
  copy: ReviewsCopy;
  children: ReactNode;
  className?: string | undefined;
}) {
  const opens = copy.list.opensInNewTab;
  const classes = className ?? compactLinkClass;
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
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {mark}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

/** In-page console paths only. Reject protocol-relative `//` and `/\`. */
function inSiteLogHref(href: string | null): string | null {
  if (href === null || !href.startsWith("/")) return null;
  const second = href[1];
  if (second === "/" || second === "\\") return null;
  return href;
}

function replacementCopy(entry: TimelineEntry, copy: ReviewsCopy): string | null {
  if (entry.superseded !== true) return null;
  return entry.status === "failed" ? copy.issue.failedReplaced : copy.issue.replaced;
}

function StepMarks({ entry, copy }: { entry: TimelineEntry; copy: ReviewsCopy }) {
  const replacement = replacementCopy(entry, copy);
  const showStatus =
    entry.verdict === null && replacement === null && (entry.status === "running" || entry.status === "failed");
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
      <Text className="font-medium">{copy.type[entry.type]}</Text>
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
  );
}

function ViewLogAffordance({ copy }: { copy: ReviewsCopy }) {
  return (
    <Button asChild variant="secondary" size="sm">
      <Stack direction="horizontal" gap="tight">
        {copy.issue.viewLog}
        <ChevronRight aria-hidden="true" />
      </Stack>
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
  const models = displayModelLabels(entry.models);
  const finishedPrefix = entry.status === "running" ? undefined : copy.list.finished;
  return (
    <Stack direction="horizontal" gap="sm" className={className}>
      <Stack gap="tight" className="content-shrink flex-1">
        <StepMarks entry={entry} copy={copy} />
        {models !== "" ? (
          <Badge variant="meta" className="w-fit max-md:max-w-full">
            {models}
          </Badge>
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
        </Stack>
      </Stack>
      {log ? <ViewLogAffordance copy={copy} /> : null}
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
  const logHref = inSiteLogHref(href);
  if (logHref === null) {
    return <TimelineRowBody entry={entry} copy={copy} log={false} className={rowLayout} />;
  }
  return (
    <CompactLogLink href={logHref} copy={copy} className={logCellClass}>
      <TimelineRowBody
        entry={entry}
        copy={copy}
        log
        className="items-start justify-between max-md:flex-col max-md:items-stretch"
      />
    </CompactLogLink>
  );
}
