"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, Stack, Text, UpdatedAgo, formatDuration } from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import { displayModelLabels } from "../model/display-model";
import { entryUpdatedAt } from "../model/latest-status";
import type { TimelineEntry } from "../ports/review-port";
import { LatestStatusMark } from "./issue-status";

const compactLinkClass =
  "hit-target inline-flex w-fit shrink-0 items-center gap-icon text-dense text-info link-offset hover:underline focus-ring";

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

export function TimelineRow({
  entry,
  href,
  copy,
}: {
  entry: TimelineEntry;
  href: string | null;
  copy: ReviewsCopy;
}) {
  const models = displayModelLabels(entry.models);
  const finishedPrefix = entry.status === "running" ? undefined : copy.list.finished;
  return (
    <Stack
      direction="horizontal"
      gap="sm"
      className="items-start justify-between py-row max-md:flex-col max-md:items-stretch"
    >
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
      {href === null ? null : (
        <CompactLogLink href={href} copy={copy}>
          {copy.issue.viewLog}
        </CompactLogLink>
      )}
    </Stack>
  );
}
