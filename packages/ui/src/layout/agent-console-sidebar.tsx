import { formatMessage } from "@zedtech/zedkit-i18n";

import { Button } from "../button/button.js";
import { Badge } from "../feedback/badge.js";
import { StatusDot } from "../feedback/status-dot.js";
import { Text } from "../typography/typography.js";
import { Stack } from "./layout.js";
import { SidebarNavGroup, SidebarNavItem } from "./sidebar-nav.js";
import {
  durationText,
  groupConsoleItems,
  groupLabel,
  httpHref,
  shortSha,
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
  return (
    <Stack data-slot="agent-console-run" gap="sm">
      <div className="flex flex-wrap items-center gap-stack-tight">
        {run.pr != null ? <Badge variant="meta">{formatMessage(copy.pr, { n: run.pr })}</Badge> : null}
        {run.sha ? <Badge variant="meta">{shortSha(run.sha)}</Badge> : null}
        {run.reviewSize ? <Badge variant="meta">{run.reviewSize}</Badge> : null}
        {run.verdict ? <Badge variant="meta">{run.verdict}</Badge> : null}
        {run.confidence != null ? (
          <Badge variant="meta">{formatMessage(copy.confidence, { n: run.confidence })}</Badge>
        ) : null}
      </div>
      <Text typeRole="small">{run.engineLabel}</Text>
      <Text typeRole="caption">{durationText(run.durationMs, locale)}</Text>
      {reviewHref ? (
        <Button variant="link" size="sm" asChild>
          <a href={reviewHref}>{copy.postedReview}</a>
        </Button>
      ) : null}
    </Stack>
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
                <SidebarNavItem
                  type="button"
                  active={row.id === selectedId}
                  status={
                    <StatusDot
                      tone={row.running ? "active" : row.status === "failed" ? "danger" : "idle"}
                      pulse={row.running}
                    />
                  }
                  meta={`${row.status} · ${row.model} · ${durationText(row.durationMs, locale)}`}
                  count={row.toolCount}
                  onClick={() => onSelect(row.id)}
                >
                  {row.name}
                </SidebarNavItem>
              </li>
            ))}
          </ul>
        </SidebarNavGroup>
      ))}
    </nav>
  );
}
