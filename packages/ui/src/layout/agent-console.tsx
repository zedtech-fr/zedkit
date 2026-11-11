"use client";

import { useRef, useState } from "react";

import { Button } from "../button/button.js";
import { Text } from "../typography/typography.js";
import { useUiMessages } from "../ui-provider.js";
import { cn } from "../utils.js";
import { AppShell } from "./app-shell.js";
import { ConsoleMain, JumpOverlay } from "./agent-console-panes.js";
import { ConsoleSidebar } from "./agent-console-sidebar.js";
import { defaultConsoleSelectedId, type AgentConsoleProps } from "./agent-console-model.js";
import { useStickToBottom } from "./stick-to-bottom.js";

export type {
  AgentConsoleDecision,
  AgentConsoleEntry,
  AgentConsoleFindingDisposition,
  AgentConsoleItem,
  AgentConsoleProps,
  AgentConsoleRun,
} from "./agent-console-model.js";

export function AgentConsole({
  run,
  items,
  decision = null,
  selectedId: selectedIdProp,
  defaultSelectedId,
  onSelectedIdChange,
  className,
}: AgentConsoleProps) {
  const messages = useUiMessages();
  const copy = messages.agentConsole;
  const locale = messages.locale;
  const mainRef = useRef<HTMLElement | null>(null);
  const { isStuck, jumpToLatest } = useStickToBottom(mainRef);
  const fallbackId = defaultConsoleSelectedId(items, defaultSelectedId);
  const [uncontrolledId, setUncontrolledId] = useState(fallbackId);
  const requestedId = selectedIdProp ?? uncontrolledId ?? fallbackId;
  const selected = items.find((item) => item.id === requestedId) ?? items.find((item) => item.id === fallbackId);

  const select = (id: string) => {
    onSelectedIdChange?.(id);
    if (selectedIdProp === undefined) setUncontrolledId(id);
  };

  return (
    <div data-slot="agent-console" className={cn("relative h-svh overflow-hidden", className)}>
      <AppShell
        className="h-full"
        fixedHeight
        mainRef={mainRef}
        sidebar={
          <ConsoleSidebar
            run={run}
            items={items}
            selectedId={selected?.id}
            copy={copy}
            locale={locale}
            onSelect={select}
          />
        }
        sidebarTrigger={
          <Button type="button" variant="outline" size="sm">
            {copy.sidebarTrigger}
          </Button>
        }
        topbar={
          selected ? (
            <div className="flex items-center surface-pad-md">
              <Text typeRole="small">{selected.name}</Text>
            </div>
          ) : undefined
        }
      >
        <ConsoleMain selected={selected} decision={decision} copy={copy} locale={locale} />
      </AppShell>
      <JumpOverlay stuck={isStuck} onJump={jumpToLatest} />
    </div>
  );
}
