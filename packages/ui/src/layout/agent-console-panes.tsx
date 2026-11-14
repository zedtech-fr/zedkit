import { useId } from "react";
import { formatMessage } from "@zedtech/zedkit-i18n";

import { Badge } from "../feedback/badge.js";
import { EmptyState } from "../feedback/empty-state.js";
import { formatDuration } from "../feedback/format-duration.js";
import { LivePulse } from "../feedback/live-pulse.js";
import { StatusDot } from "../feedback/status-dot.js";
import { StreamStatus } from "../feedback/stream-status.js";
import { UpdatedAgo } from "../feedback/updated-ago.js";
import { Card, CardContent } from "../surfaces/card.js";
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
import { DecisionCard } from "./agent-console-decision.js";
import {
  MISSING,
  compactTokenCount,
  durationText,
  formatStarted,
  groupLabel,
  statusLabel,
  statusTone,
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

export function ItemHeader({
  item,
  copy,
  headingLevel = 2,
}: {
  item: AgentConsoleItem;
  copy: AgentConsoleCopy;
  headingLevel?: 1 | 2;
}) {
  const engine = item.engineLabel?.trim() ? item.engineLabel : item.model;
  const status = item.status.trim();
  return (
    <header className="flex flex-col gap-stack-sm">
      <div className="flex flex-wrap items-center gap-stack-sm">
        <Text typeRole="label" className="text-muted-foreground uppercase">
          {groupLabel(item.kind, copy)}
        </Text>
        {status ? (
          <Badge variant="outline" className="gap-stack-tight">
            <StatusDot tone={statusTone(item.status, item.running)} pulse={item.running} />
            {statusLabel(item.status)}
          </Badge>
        ) : null}
        <Badge variant="outline" className="font-mono font-normal">
          {engine}
        </Badge>
      </div>
      <Heading level={headingLevel} typeRole="title">
        {item.name}
      </Heading>
    </header>
  );
}

function TranscriptSection({
  entries,
  copy,
  locale,
}: {
  entries: readonly AgentConsoleEntry[];
  copy: AgentConsoleCopy;
  locale: string;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-stack-sm">
      <Heading level={2} typeRole="label" className="uppercase" id={headingId}>
        {copy.transcript}
      </Heading>
      {entries.length > 0 ? (
        <Stack gap="sm">
          {groupToolCallBursts(entries).map((group) =>
            group.type === "burst" ? (
              <TranscriptBurst key={group.items.map((row) => row.id).join("-")} aria-label={copy.toolBurst}>
                {group.items.map((row) => renderEntry(row, locale))}
              </TranscriptBurst>
            ) : (
              renderEntry(group.item, locale)
            ),
          )}
        </Stack>
      ) : (
        <EmptyState title={copy.noTranscriptTitle} description={copy.noTranscriptDescription} />
      )}
    </section>
  );
}

export function ItemDetail({
  item,
  copy,
  locale,
}: {
  item: AgentConsoleItem;
  copy: AgentConsoleCopy;
  locale: string;
}) {
  const showTokens =
    Number.isFinite(item.tokensIn) &&
    Number.isFinite(item.tokensOut) &&
    (item.tokensIn !== 0 || item.tokensOut !== 0);
  return (
    <Stack gap="md">
      {item.running ? (
        <div className="flex flex-wrap items-center gap-stack-sm">
          <LivePulse />
          {item.streamLabel ? <StreamStatus label={item.streamLabel} /> : null}
        </div>
      ) : null}
      <Card>
        <CardContent>
          <DetailPanel
            variant="grid"
            className="grid-pair"
            items={[
              { label: copy.started, value: formatStarted(item.startedAt, locale) },
              { label: copy.duration, value: durationText(item.durationMs, locale) },
              { label: copy.toolCalls, value: String(item.toolCount) },
              ...(showTokens
                ? [
                    {
                      label: copy.tokens,
                      value: formatMessage(copy.tokensInOut, {
                        in: compactTokenCount(item.tokensIn, locale),
                        out: compactTokenCount(item.tokensOut, locale),
                      }),
                    },
                  ]
                : []),
              {
                label: copy.lastActivity,
                value: item.lastActivityAt != null ? <UpdatedAgo date={item.lastActivityAt} /> : MISSING,
              },
            ]}
          />
        </CardContent>
      </Card>
      <TranscriptSection entries={item.entries} copy={copy} locale={locale} />
    </Stack>
  );
}

export function ConsoleMain({
  selected,
  decision,
  copy,
  locale,
  headingLevel,
}: {
  selected: AgentConsoleItem | undefined;
  decision: AgentConsoleDecision | null;
  copy: AgentConsoleCopy;
  locale: string;
  headingLevel?: 1 | 2;
}) {
  if (!selected) return <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />;
  return (
    <Stack gap="md">
      <ItemHeader item={selected} copy={copy} {...(headingLevel === undefined ? {} : { headingLevel })} />
      {selected.kind === "main" && decision ? <DecisionCard decision={decision} copy={copy} /> : null}
      <ItemDetail item={selected} copy={copy} locale={locale} />
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
