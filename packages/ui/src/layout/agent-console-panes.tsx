import { ChevronDown } from "lucide-react";

import { formatMessage } from "@zedtech/zedkit-i18n";

import { Button } from "../button/button.js";
import { Badge } from "../feedback/badge.js";
import { EmptyState } from "../feedback/empty-state.js";
import { formatDuration } from "../feedback/format-duration.js";
import { LivePulse } from "../feedback/live-pulse.js";
import { StreamStatus } from "../feedback/stream-status.js";
import { UpdatedAgo } from "../feedback/updated-ago.js";
import { Card, CardContent, CardHeader } from "../surfaces/card.js";
import {
  AssistantMessage,
  ThinkingRow,
  ToolCallRow,
  TranscriptBurst,
  groupToolCallBursts,
} from "../transcript/transcript-rows.js";
import { Heading, Text } from "../typography/typography.js";
import { DetailPanel } from "./detail-panel.js";
import { Stack } from "./layout.js";
import { JumpToLatest } from "./stick-to-bottom.js";
import {
  MISSING,
  dispositionLabel,
  durationText,
  formatStarted,
  httpHref,
  type AgentConsoleCopy,
  type AgentConsoleDecision,
  type AgentConsoleEntry,
  type AgentConsoleItem,
} from "./agent-console-model.js";

function renderEntry(entry: AgentConsoleEntry, locale: string) {
  if (entry.kind === "tool") {
    return (
      <ToolCallRow
        key={entry.id}
        name={entry.name}
        {...(entry.status != null ? { status: entry.status } : {})}
        {...(entry.durationMs != null ? { duration: formatDuration(entry.durationMs, locale) } : {})}
      >
        {entry.body}
      </ToolCallRow>
    );
  }
  if (entry.kind === "reasoning") {
    return <ThinkingRow key={entry.id} text={entry.text} {...(entry.live === undefined ? {} : { live: entry.live })} />;
  }
  return <AssistantMessage key={entry.id}>{entry.text}</AssistantMessage>;
}

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
        {firstPass.verdict ? <Text>{firstPass.verdict}</Text> : null}
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
        <Badge variant={secondPass.blocksMerge ? "soft-danger" : "soft-success"}>
          {secondPass.blocksMerge ? copy.blocksMerge : copy.allowsMerge}
        </Badge>
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
      ) : null}
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
        <Stack gap="tight">
          <Heading level={3} typeRole="small">
            {copy.dismissed}
          </Heading>
          <ul className="flex list-none flex-col gap-stack-tight">
            {decision.dismissed.map((row, index) => (
              <li key={`${index}-${row}`}>
                <Text as="span">{row}</Text>
              </li>
            ))}
          </ul>
        </Stack>
      ) : null}
    </>
  );
}

export function DecisionCard({ decision, copy }: { decision: AgentConsoleDecision; copy: AgentConsoleCopy }) {
  const reviewHref = httpHref(decision.postedReviewHref);
  return (
    <Card data-slot="agent-console-decision">
      <CardHeader className="flex flex-row flex-wrap items-center gap-stack-sm">
        <Heading level={2} typeRole="cardTitle">
          {copy.finalDecision}
        </Heading>
        {decision.confidence != null ? (
          <Badge variant="meta">{formatMessage(copy.confidence, { n: decision.confidence })}</Badge>
        ) : null}
        {decision.verdict ? <Badge variant="meta">{decision.verdict}</Badge> : null}
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

export function ItemPane({
  item,
  copy,
  locale,
}: {
  item: AgentConsoleItem;
  copy: AgentConsoleCopy;
  locale: string;
}) {
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  return (
    <Stack gap="md">
      {item.running ? (
        <div className="flex flex-wrap items-center gap-stack-sm">
          <LivePulse />
          {item.streamLabel ? <StreamStatus label={item.streamLabel} /> : null}
        </div>
      ) : null}
      <DetailPanel
        variant="grid"
        items={[
          { label: copy.started, value: formatStarted(item.startedAt, locale) },
          { label: copy.duration, value: durationText(item.durationMs, locale) },
          { label: copy.toolCalls, value: String(item.toolCount) },
          {
            label: copy.tokens,
            value: formatMessage(copy.tokensInOut, {
              in: number.format(item.tokensIn),
              out: number.format(item.tokensOut),
            }),
          },
          {
            label: copy.lastActivity,
            value: item.lastActivityAt != null ? <UpdatedAgo date={item.lastActivityAt} /> : MISSING,
          },
        ]}
      />
      <Stack gap="sm">
        {groupToolCallBursts(item.entries).map((group) =>
          group.type === "burst" ? (
            <TranscriptBurst key={group.items.map((row) => row.id).join("-")} aria-label={copy.toolBurst}>
              {group.items.map((row) => renderEntry(row, locale))}
            </TranscriptBurst>
          ) : (
            renderEntry(group.item, locale)
          ),
        )}
      </Stack>
    </Stack>
  );
}

export function ConsoleMain({
  selected,
  decision,
  copy,
  locale,
}: {
  selected: AgentConsoleItem | undefined;
  decision: AgentConsoleDecision | null;
  copy: AgentConsoleCopy;
  locale: string;
}) {
  if (!selected) return <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />;
  return (
    <Stack gap="md">
      {selected.kind === "main" && decision ? <DecisionCard decision={decision} copy={copy} /> : null}
      <ItemPane item={selected} copy={copy} locale={locale} />
    </Stack>
  );
}

export function JumpOverlay({ stuck, onJump }: { stuck: boolean; onJump: () => void }) {
  return (
    <div className="pointer-events-none absolute pin-x pin-bottom z-header flex">
      <div className="hidden w-app-shell-sidebar shrink-0 md:block" aria-hidden />
      <div className="flex flex-1 justify-center p-app-shell-padding">
        <JumpToLatest className="pointer-events-auto" stuck={stuck} onClick={onJump} />
      </div>
    </div>
  );
}
