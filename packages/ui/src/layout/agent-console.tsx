"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

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

function ConsoleTopbarName({ name }: { name: string }) {
  return (
    <div className="flex items-center surface-pad-md">
      <Text typeRole="small">{name}</Text>
    </div>
  );
}

function useResetSettledScroll(
  scroller: RefObject<HTMLElement | null>,
  selectedId: string | undefined,
  selectedRunning: boolean,
) {
  const prevSelectedId = useRef(selectedId);
  useLayoutEffect(() => {
    const idChanged = prevSelectedId.current !== selectedId;
    prevSelectedId.current = selectedId;
    if (!idChanged || selectedRunning) return;
    const el = scroller.current;
    if (el) el.scrollTop = 0;
  }, [scroller, selectedId, selectedRunning]);
}

export function AgentConsole({
  run,
  items,
  decision = null,
  selectedId: selectedIdProp,
  defaultSelectedId,
  onSelectedIdChange,
  className,
  headingLevel,
}: AgentConsoleProps) {
  const messages = useUiMessages();
  const copy = messages.agentConsole;
  const locale = messages.locale;
  const mainRef = useRef<HTMLElement | null>(null);
  const fallbackId = defaultConsoleSelectedId(items, defaultSelectedId);
  const [uncontrolledId, setUncontrolledId] = useState(fallbackId);
  const requestedId = selectedIdProp ?? uncontrolledId ?? fallbackId;
  const selected = items.find((item) => item.id === requestedId) ?? items.find((item) => item.id === fallbackId);
  const { isStuck, jumpToLatest } = useStickToBottom(mainRef, { enabled: selected?.running ?? false });
  useResetSettledScroll(mainRef, selected?.id, selected?.running ?? false);

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
        sidebarTrigger={<Button type="button" variant="outline" size="sm">{copy.sidebarTrigger}</Button>}
        topbar={selected ? <ConsoleTopbarName name={selected.name} /> : undefined}
      >
        <ConsoleMain
          selected={selected}
          decision={decision}
          copy={copy}
          locale={locale}
          {...(headingLevel === undefined ? {} : { headingLevel })}
        />
      </AppShell>
      <JumpOverlay stuck={isStuck} onJump={jumpToLatest} />
    </div>
  );
}
