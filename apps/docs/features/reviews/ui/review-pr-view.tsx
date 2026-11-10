"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  Heading,
  PageHeader,
  Stack,
  StatusLabel,
  Text,
  UpdatedAgo,
  type BadgeProps,
  type StatusLabelTone,
} from "@zedtech/zedkit-ui";

import type { ReviewRecord, ReviewVerdict } from "../ports/review-port";
import type { ReviewsCopy } from "../i18n/reviews-copy";
import { ReviewAppearanceFrame } from "./appearance-panel";

const VERDICT_BADGE: Record<ReviewVerdict, BadgeProps["variant"]> = {
  approve: "success",
  "request-changes": "warning",
  comment: "secondary",
  error: "destructive",
};

const STATUS_TONE: Record<ReviewRecord["status"], StatusLabelTone> = {
  running: "loading",
  done: "saved",
  error: "error",
};

function VerdictBand({ record, copy }: { record: ReviewRecord; copy: ReviewsCopy }) {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap">
      <Badge variant={VERDICT_BADGE[record.verdict]}>{copy.verdict[record.verdict]}</Badge>
      <Text typeRole="body">
        {copy.pr.confidence} {record.confidence}
      </Text>
      <StatusLabel tone={STATUS_TONE[record.status]}>{copy.status[record.status]}</StatusLabel>
      <Badge variant="outline">{copy.prState[record.prState]}</Badge>
      <Badge variant="meta" title={record.headSha}>
        {record.headSha.slice(0, 7)}
      </Badge>
      <UpdatedAgo date={new Date(record.lastRunAt)} />
    </Stack>
  );
}

function ReviewBlock({
  title,
  empty,
  hasItems,
  children,
}: {
  title: string;
  empty: string;
  hasItems: boolean;
  children: ReactNode;
}) {
  return (
    <Stack gap="sm">
      <Heading level={2} typeRole="section">
        {title}
      </Heading>
      {hasItems ? children : <EmptyState description={empty} />}
    </Stack>
  );
}

function PrSections({ record, copy }: { record: ReviewRecord; copy: ReviewsCopy }) {
  return (
    <>
      <ReviewBlock title={copy.pr.actions} empty={copy.pr.actionsEmpty} hasItems={record.actions.length > 0}>
        <ul className="flex flex-col gap-stack-sm">
          {record.actions.map((action) => (
            <li key={action.title}>
              <Text typeRole="body">{action.title}</Text>
              <Text variant="muted">{action.detail}</Text>
            </li>
          ))}
        </ul>
      </ReviewBlock>
      <ReviewBlock title={copy.pr.notes} empty={copy.pr.notesEmpty} hasItems={record.notes.trim().length > 0}>
        <Text typeRole="prose">{record.notes}</Text>
      </ReviewBlock>
      <ReviewBlock title={copy.pr.runs} empty={copy.pr.runsEmpty} hasItems={record.runs.length > 0}>
        <ul className="flex flex-col gap-stack-sm">
          {record.runs.map((run) => (
            <li key={run.id}>
              <Button asChild variant="link">
                <Link href={`/reviews/pr/${record.number}/runs/${run.id}`}>
                  {copy.pr.openRun} {run.id}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </ReviewBlock>
      <details>
        <summary className="text-zk-type-label">{copy.pr.agentDetail}</summary>
        <EmptyState description={copy.pr.agentDetailEmpty} />
      </details>
    </>
  );
}

export function ReviewPrView({ record, copy }: { record: ReviewRecord; copy: ReviewsCopy }) {
  return (
    <ReviewAppearanceFrame copy={copy}>
      {(panel) => (
        <>
          <PageHeader
            title={`#${record.number} ${record.title}`}
            back={
              <Button asChild variant="link" size="sm">
                <Link href="/reviews">{copy.pr.back}</Link>
              </Button>
            }
          />
          <VerdictBand record={record} copy={copy} />
          {panel}
          <PrSections record={record} copy={copy} />
        </>
      )}
    </ReviewAppearanceFrame>
  );
}
