import { formatMessage } from "@zedtech/zedkit-i18n";

import { Button } from "../button/button.js";
import { Badge } from "../feedback/badge.js";
import { LivePulse } from "../feedback/live-pulse.js";
import { StatusDot } from "../feedback/status-dot.js";
import { Text } from "../typography/typography.js";
import { cn } from "../utils.js";
import { Stack } from "./layout.js";
import { SidebarNavGroup } from "./sidebar-nav.js";
import {
  durationText,
  groupConsoleItems,
  groupLabel,
  httpHref,
  shortSha,
  statusLabel,
  statusTone,
  verdictLabel,
  type AgentConsoleCopy,
  type AgentConsoleItem,
  type AgentConsoleRun,
} from "./agent-console-model.js";

function ConsoleRunMeta({
  run,
  copy,
  locale,
}: {
  run: AgentConsoleRun;
  copy: AgentConsoleCopy;
  locale: string;
}) {
  const reviewHref = httpHref(run.postedReviewHref);
  const verdict = verdictLabel(run.verdict);
  return (
    <Stack data-slot="agent-console-run" gap="sm">
      {run.running ? <LivePulse active /> : null}
      <div className="flex flex-wrap items-center gap-stack-tight">
        {run.pr != null ? <Badge variant="meta">{formatMessage(copy.pr, { n: run.pr })}</Badge> : null}
        {run.sha ? <Badge variant="meta">{shortSha(run.sha)}</Badge> : null}
        {run.reviewSize ? <Badge variant="meta">{run.reviewSize}</Badge> : null}
        {verdict ? <Badge variant="meta">{verdict}</Badge> : null}
        {run.confidence != null ? (
          <Badge variant="meta">{formatMessage(copy.confidence, { n: run.confidence })}</Badge>
        ) : null}
      </div>
      <Text typeRole="small">{run.engineLabel}</Text>
      <Text typeRole="caption">{durationText(run.durationMs, locale)}</Text>
      {reviewHref ? (
        <Button variant="link" size="sm" asChild className="self-start">
          <a href={reviewHref}>{copy.postedReview}</a>
        </Button>
      ) : null}
    </Stack>
  );
}

function toolsCountLabel(n: number, copy: AgentConsoleCopy, locale: string): string {
  const french = locale.toLowerCase().startsWith("fr");
  const one = n === 1 || (french && n === 0);
  return formatMessage(one ? copy.toolsOne : copy.tools, { n });
}

function ConsoleRow({
  row,
  active,
  copy,
  locale,
  onSelect,
}: {
  row: AgentConsoleItem;
  active: boolean;
  copy: AgentConsoleCopy;
  locale: string;
  onSelect: (id: string) => void;
}) {
  const status = row.running && row.streamLabel ? row.streamLabel : statusLabel(row.status);
  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-y-stack-tight rounded-lg border px-control-inline py-row text-left focus-ring-control",
        active ? "border-border muted-wash font-medium" : "border-transparent hover:ghost-hover",
      )}
    >
      <span className="flex items-center gap-stack-sm">
        <StatusDot tone={statusTone(row.status, row.running)} pulse={row.running} />
        <span className="content-shrink flex-1 truncate text-dense">{row.name}</span>
        <span aria-hidden="true" className="shrink-0 text-caption text-muted-foreground tabular-nums">
          {durationText(row.durationMs, locale)}
        </span>
      </span>
      <span aria-hidden="true" className="flex items-center gap-stack-sm pl-list">
        <span className="content-shrink flex-1 truncate font-mono text-caption text-muted-foreground">
          {row.model}
        </span>
        <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
          {toolsCountLabel(row.toolCount, copy, locale)}
        </span>
      </span>
      <span aria-hidden="true" className="truncate pl-list text-caption text-muted-foreground">
        {status}
      </span>
    </button>
  );
}

export function ConsoleSidebar({
  run,
  items,
  selectedId,
  copy,
  locale,
  onSelect,
}: {
  run: AgentConsoleRun;
  items: readonly AgentConsoleItem[];
  selectedId: string | undefined;
  copy: AgentConsoleCopy;
  locale: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label={copy.agentsNav} className="flex flex-col gap-stack-sm surface-pad-md">
      <ConsoleRunMeta run={run} copy={copy} locale={locale} />
      {groupConsoleItems(items).map((group) => (
        <SidebarNavGroup key={group.kind} label={groupLabel(group.kind, copy)} open>
          <ul className="flex list-none flex-col gap-stack-tight">
            {group.items.map((row) => (
              <li key={row.id}>
                <ConsoleRow
                  row={row}
                  active={row.id === selectedId}
                  copy={copy}
                  locale={locale}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </SidebarNavGroup>
      ))}
    </nav>
  );
}
