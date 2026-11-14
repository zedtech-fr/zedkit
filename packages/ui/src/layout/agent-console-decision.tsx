import { ArrowRight, ChevronDown, CircleCheck } from "lucide-react";

import { formatMessage } from "@zedtech/zedkit-i18n";

import { Button } from "../button/button.js";
import { Badge } from "../feedback/badge.js";
import { Card, CardContent, CardHeader } from "../surfaces/card.js";
import { Heading, Text } from "../typography/typography.js";
import { Stack } from "./layout.js";
import {
  dispositionLabel,
  httpHref,
  verdictLabel,
  type AgentConsoleCopy,
  type AgentConsoleDecision,
} from "./agent-console-model.js";

function FirstPass({
  firstPass,
  copy,
}: {
  firstPass: NonNullable<AgentConsoleDecision["firstPass"]>;
  copy: AgentConsoleCopy;
}) {
  return (
    <details className="group">
      <summary className="flex min-h-target cursor-pointer list-none items-center gap-stack-sm text-dense focus-ring-control [&::-webkit-details-marker]:hidden">
        <span className="content-shrink flex-1">
          {copy.firstPass} · {copy.superseded} · {copy.outdated}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-icon shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      <Stack gap="sm">
        {firstPass.verdict ? <Text>{verdictLabel(firstPass.verdict)}</Text> : null}
        {firstPass.confidence != null ? (
          <Text>{formatMessage(copy.confidence, { n: firstPass.confidence })}</Text>
        ) : null}
        <ul className="flex list-none flex-col gap-stack-sm">
          {firstPass.findings.map((finding) => (
            <li key={finding.id} className="flex flex-wrap items-center gap-stack-sm">
              <Badge
                variant={
                  finding.disposition === "kept"
                    ? "soft-success"
                    : finding.disposition === "downgraded"
                      ? "soft-warning"
                      : "soft-neutral"
                }
              >
                {dispositionLabel(finding.disposition, copy)}
              </Badge>
              <Text as="span">{finding.text}</Text>
            </li>
          ))}
        </ul>
      </Stack>
    </details>
  );
}

function SecondPass({
  secondPass,
  copy,
}: {
  secondPass: NonNullable<AgentConsoleDecision["secondPass"]>;
  copy: AgentConsoleCopy;
}) {
  return (
    <Stack gap="tight">
      <Heading level={3} typeRole="small">
        {copy.secondPass}
      </Heading>
      {secondPass.model ? <Text>{secondPass.model}</Text> : null}
      {secondPass.blocksMerge != null ? (
        <div className="flex flex-wrap items-center gap-stack-sm">
          <Badge variant={secondPass.blocksMerge ? "soft-danger" : "soft-success"}>
            {secondPass.blocksMerge ? copy.blocksMerge : copy.allowsMerge}
          </Badge>
        </div>
      ) : null}
      {secondPass.summary ? <Text>{secondPass.summary}</Text> : null}
    </Stack>
  );
}

function DecisionLists({ decision, copy }: { decision: AgentConsoleDecision; copy: AgentConsoleCopy }) {
  return (
    <>
      {decision.mustChange.length > 0 ? (
        <Stack gap="tight">
          <Heading level={3} typeRole="small">
            {copy.mustChange}
          </Heading>
          <ul className="flex list-none flex-col gap-stack-tight">
            {decision.mustChange.map((row, index) => (
              <li key={`${index}-${row.text}`}>
                <Text as="span">{row.text}</Text>
              </li>
            ))}
          </ul>
        </Stack>
      ) : (
        <p className="flex items-center gap-stack-sm text-dense text-muted-foreground">
          <CircleCheck aria-hidden="true" className="size-icon shrink-0 text-success" />
          {copy.mustChangeEmpty}
        </p>
      )}
      {decision.notes.length > 0 ? (
        <Stack gap="tight">
          <Heading level={3} typeRole="small">
            {copy.notes}
          </Heading>
          <ul className="flex list-none flex-col gap-stack-tight">
            {decision.notes.map((note, index) => (
              <li key={`${index}-${note.text}`} className="flex flex-wrap items-center gap-stack-sm">
                {note.tag === "downgraded" ? <Badge variant="soft-warning">{copy.downgraded}</Badge> : null}
                {note.tag === "approved" ? <Badge variant="soft-success">{copy.approved}</Badge> : null}
                <Text as="span">{note.text}</Text>
              </li>
            ))}
          </ul>
        </Stack>
      ) : null}
      {decision.dismissed.length > 0 ? (
        <details className="flex flex-col gap-stack-sm">
          <summary className="cursor-pointer text-dense text-muted-foreground focus-ring-control hover:text-foreground">
            {copy.dismissed} ({decision.dismissed.length})
          </summary>
          <ul className="flex list-none flex-col gap-stack-tight">
            {decision.dismissed.map((row, index) => (
              <li key={`${index}-${row}`}>
                <Text as="span" typeRole="small" className="text-muted-foreground line-through">
                  {row}
                </Text>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

function DecisionFlow({ decision, copy }: { decision: AgentConsoleDecision; copy: AgentConsoleCopy }) {
  const verdict = verdictLabel(decision.verdict);
  const firstVerdict = decision.firstPass ? verdictLabel(decision.firstPass.verdict) : null;
  const secondModel = decision.secondPass?.model?.trim() ? decision.secondPass.model : null;
  const secondBlocks = decision.secondPass?.blocksMerge ?? null;
  return (
    <div className="flex flex-wrap items-center gap-stack-sm text-dense text-muted-foreground">
      {decision.firstPass ? (
        <>
          <span>{copy.firstPass}</span>
          {firstVerdict ? <Badge variant="meta">{firstVerdict}</Badge> : null}
          {decision.firstPass.confidence != null ? (
            <Badge variant="meta">{formatMessage(copy.confidence, { n: decision.firstPass.confidence })}</Badge>
          ) : null}
          <ArrowRight aria-hidden="true" className="size-icon shrink-0" />
        </>
      ) : null}
      {decision.secondPass ? (
        <>
          <span>
            {copy.secondPass}
            {secondModel ? (
              <>
                {" "}
                <span className="font-mono">{secondModel}</span>
              </>
            ) : null}
            {secondBlocks != null ? <>: {secondBlocks ? copy.blocksMerge : copy.allowsMerge}</> : null}
          </span>
          <ArrowRight aria-hidden="true" className="size-icon shrink-0" />
        </>
      ) : null}
      <span>{decision.posted ? copy.posted : copy.decided}</span>
      {verdict ? <Badge variant="meta">{verdict}</Badge> : null}
      {decision.confidence != null ? (
        <Badge variant="meta">{formatMessage(copy.confidence, { n: decision.confidence })}</Badge>
      ) : null}
    </div>
  );
}

export function DecisionCard({ decision, copy }: { decision: AgentConsoleDecision; copy: AgentConsoleCopy }) {
  const reviewHref = httpHref(decision.postedReviewHref);
  const verdict = verdictLabel(decision.verdict);
  return (
    <Card data-slot="agent-console-decision">
      <CardHeader className="flex flex-row flex-wrap items-center gap-stack-sm">
        <Heading level={2} typeRole="cardTitle">
          {copy.finalDecision}
        </Heading>
        {decision.confidence != null ? (
          <Badge variant="meta">{formatMessage(copy.confidence, { n: decision.confidence })}</Badge>
        ) : null}
        {verdict ? <Badge variant="meta">{verdict}</Badge> : null}
        <Badge variant={decision.posted ? "soft-success" : "soft-neutral"}>
          {decision.posted ? copy.posted : copy.decided}
        </Badge>
        {reviewHref ? (
          <Button variant="link" size="sm" asChild>
            <a href={reviewHref}>{copy.postedReview}</a>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <Stack gap="md">
          <DecisionFlow decision={decision} copy={copy} />
          {decision.firstPass ? <FirstPass firstPass={decision.firstPass} copy={copy} /> : null}
          {decision.secondPass ? <SecondPass secondPass={decision.secondPass} copy={copy} /> : null}
          {decision.summary ? (
            <Stack gap="tight">
              <Heading level={3} typeRole="small">
                {copy.summary}
              </Heading>
              <Text>{decision.summary}</Text>
            </Stack>
          ) : null}
          <DecisionLists decision={decision} copy={copy} />
        </Stack>
      </CardContent>
    </Card>
  );
}
