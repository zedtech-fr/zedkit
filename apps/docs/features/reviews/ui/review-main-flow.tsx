"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  Heading,
  Stack,
  Text,
  type BadgeProps,
} from "@zedtech/zedkit-ui";

import { reviewMainFlow, type ReviewMainFlow as ReviewMainFlowModel } from "../model/main-flow";
import type { ReviewFindingDisposition, ReviewRecord, ReviewVerdict } from "../ports/review-port";
import type { ReviewsCopy } from "../i18n/reviews-copy";

const VERDICT_BADGE: Record<ReviewVerdict, BadgeProps["variant"]> = {
  approve: "success",
  "request-changes": "warning",
  comment: "secondary",
  error: "destructive",
};

const DISPOSITION_BADGE: Record<ReviewFindingDisposition, BadgeProps["variant"]> = {
  kept: "warning",
  downgraded: "secondary",
  dismissed: "outline",
};

function DecisionBand({
  decision,
  copy,
  extra,
}: {
  decision: ReviewMainFlowModel["decision"];
  copy: ReviewsCopy;
  extra?: ReactNode;
}) {
  return (
    <Stack gap="sm">
      <Stack direction="horizontal" gap="sm" className="flex-wrap">
        <Badge variant={VERDICT_BADGE[decision.verdict]}>{copy.verdict[decision.verdict]}</Badge>
        <Text typeRole="body">
          {copy.pr.confidence} {decision.confidence}
        </Text>
        {extra}
      </Stack>
      {decision.summary.length > 0 ? <Text typeRole="body">{decision.summary}</Text> : null}
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

function MustChange({
  blockers,
  copy,
}: {
  blockers: ReviewMainFlowModel["blockers"];
  copy: ReviewsCopy;
}) {
  return (
    <Stack gap="sm">
      <Heading level={2} typeRole="section">
        {copy.pr.mustChange}
      </Heading>
      <ul className="flex flex-col gap-stack-sm">
        {blockers.map((blocker) => (
          <li key={blocker.title}>
            <Text typeRole="body">{blocker.title}</Text>
            <Text variant="muted">{blocker.detail}</Text>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

function FirstPass({
  findings,
  copy,
}: {
  findings: NonNullable<ReviewMainFlowModel["firstPass"]>["findings"];
  copy: ReviewsCopy;
}) {
  return (
    <details>
      <summary className="text-zk-type-label">
        {copy.pr.firstPass}{" "}
        <Badge asChild variant="meta">
          <span>{copy.pr.outdated}</span>
        </Badge>
      </summary>
      <ul className="flex flex-col gap-stack-sm">
        {findings.map((finding) => (
          <li key={finding.title}>
            <Stack direction="horizontal" gap="sm" className="flex-wrap">
              <Text typeRole="body">{finding.title}</Text>
              <Badge variant={DISPOSITION_BADGE[finding.disposition]}>
                {copy.disposition[finding.disposition]}
              </Badge>
            </Stack>
            <Text variant="muted">{finding.detail}</Text>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Notes({ notes, copy }: { notes: string; copy: ReviewsCopy }) {
  return (
    <ReviewBlock title={copy.pr.notes} empty={copy.pr.notesEmpty} hasItems={notes.trim().length > 0}>
      <Text typeRole="prose">{notes}</Text>
    </ReviewBlock>
  );
}

function Evidence({ evidence, copy }: { evidence: string; copy: ReviewsCopy }) {
  return (
    <Stack gap="sm">
      <Heading level={2} typeRole="section">
        {copy.pr.evidence}
      </Heading>
      <Text typeRole="prose">{evidence}</Text>
    </Stack>
  );
}

function RunHistory({
  record,
  runs,
  copy,
}: {
  record: ReviewRecord;
  runs: ReviewMainFlowModel["runs"];
  copy: ReviewsCopy;
}) {
  return (
    <ReviewBlock title={copy.pr.runs} empty={copy.pr.runsEmpty} hasItems={runs.length > 0}>
      <ul className="flex flex-col gap-stack-sm">
        {runs.map((run) => (
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
  );
}

function AgentDetail({ copy }: { copy: ReviewsCopy }) {
  return (
    <details>
      <summary className="text-zk-type-label">{copy.pr.agentDetail}</summary>
      <EmptyState description={copy.pr.agentDetailEmpty} />
    </details>
  );
}

function FlowSection({
  id,
  record,
  flow,
  copy,
}: {
  id: ReviewMainFlowModel["sections"][number];
  record: ReviewRecord;
  flow: ReviewMainFlowModel;
  copy: ReviewsCopy;
}) {
  switch (id) {
    case "decision":
      return null;
    case "must-change":
      return <MustChange blockers={flow.blockers} copy={copy} />;
    case "first-pass":
      return flow.firstPass === null ? null : <FirstPass findings={flow.firstPass.findings} copy={copy} />;
    case "notes":
      return <Notes notes={flow.notes} copy={copy} />;
    case "evidence":
      return flow.evidence === null ? null : <Evidence evidence={flow.evidence} copy={copy} />;
    case "run-history":
      return <RunHistory record={record} runs={flow.runs} copy={copy} />;
    case "agent-detail":
      return <AgentDetail copy={copy} />;
  }
}

function FlowSections({
  record,
  flow,
  copy,
}: {
  record: ReviewRecord;
  flow: ReviewMainFlowModel;
  copy: ReviewsCopy;
}) {
  return (
    <>
      {flow.sections.map((id) => (
        <FlowSection key={id} id={id} record={record} flow={flow} copy={copy} />
      ))}
    </>
  );
}

export function ReviewMainFlow({
  record,
  copy,
  panel,
  decisionMeta,
}: {
  record: ReviewRecord;
  copy: ReviewsCopy;
  panel: ReactNode;
  decisionMeta?: ReactNode;
}) {
  const flow = reviewMainFlow(record);
  return (
    <>
      <DecisionBand decision={flow.decision} copy={copy} extra={decisionMeta} />
      {panel}
      <FlowSections record={record} flow={flow} copy={copy} />
    </>
  );
}
