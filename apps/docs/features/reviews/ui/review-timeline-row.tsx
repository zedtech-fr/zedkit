"use client";

import Link from "next/link";
import {
  Button,
  Stack,
  Text,
  UpdatedAgo,
  formatDuration,
} from "@zedtech/zedkit-ui";

import type { ReviewsCopy } from "../i18n/reviews-copy";
import type { TimelineEntry } from "../ports/review-port";
import { LatestStatusMark } from "./issue-status";

export function TimelineRow({
  entry,
  href,
  copy,
}: {
  entry: TimelineEntry;
  href: string | null;
  copy: ReviewsCopy;
}) {
  const label = copy.type[entry.type];
  const typeControl =
    href === null ? (
      <Text>{label}</Text>
    ) : href.startsWith("https:") ? (
      <Button asChild variant="link" className="min-h-target w-fit">
        <a href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      </Button>
    ) : (
      <Button asChild variant="link" className="min-h-target w-fit">
        <Link href={href}>{label}</Link>
      </Button>
    );

  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-center border-b border-border py-row">
      {typeControl}
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
