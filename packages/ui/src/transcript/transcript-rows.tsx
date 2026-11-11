import * as React from "react";
import { ChevronDown } from "lucide-react";

import { StreamText } from "../feedback/stream-text.js";
import { Markdown } from "../typography/markdown.js";
import { cn } from "../utils.js";

export type TranscriptGroupData<T extends { kind: string }> =
  | { type: "burst"; items: T[] }
  | { type: "item"; item: T };

/**
 * Groups consecutive items whose `kind` is exactly `"tool"` into a burst when
 * the run is length ≥ 2. Other `kind` values stay as items (case-sensitive:
 * `"Tool"` is not a tool). Extra fields on `T` are preserved; key lists by a
 * stable `id`, not `name`.
 */
export function groupToolCallBursts<T extends { kind: string }>(
  items: readonly T[],
): TranscriptGroupData<T>[] {
  const groups: TranscriptGroupData<T>[] = [];
  let burst: T[] = [];

  const flushBurst = () => {
    if (burst.length >= 2) {
      groups.push({ type: "burst", items: burst });
    } else if (burst.length === 1) {
      const item = burst[0];
      if (item) groups.push({ type: "item", item });
    }
    burst = [];
  };

  for (const item of items) {
    if (item.kind === "tool") {
      burst.push(item);
      continue;
    }
    flushBurst();
    groups.push({ type: "item", item });
  }
  flushBurst();
  return groups;
}

export type ToolCallRowProps = React.ComponentProps<"details"> & {
  /**
   * Tool label on the summary. Not HTML `details` `name` (native accordion
   * grouping is not forwarded). Pass a non-empty string.
   */
  name: string;
  status?: React.ReactNode;
  /** Compact caption (for example `formatDuration` output). */
  duration?: string;
};

function ToolCallRow({ name, status, duration, className, children, ...props }: ToolCallRowProps) {
  return (
    <details data-slot="tool-call-row" className={cn("group", className)} {...props}>
      <summary
        data-slot="tool-call-row-trigger"
        className="flex min-h-target cursor-pointer list-none items-center gap-stack-sm rounded-md px-control-inline text-dense focus-ring-control [&::-webkit-details-marker]:hidden"
      >
        <span className="content-shrink flex-1 truncate" title={name}>
          {name}
        </span>
        {status != null ? (
          <span data-slot="tool-call-row-status" className="shrink-0">
            {status}
          </span>
        ) : null}
        {duration != null ? (
          <span data-slot="tool-call-row-duration" className="shrink-0 text-caption text-muted-foreground">
            {duration}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className="size-icon shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      <div data-slot="tool-call-row-body" className="pl-control-inline">
        {children}
      </div>
    </details>
  );
}

export type ThinkingRowProps = Omit<React.ComponentProps<"div">, "children"> & {
  text: string;
  /**
   * When true (default), StreamText is a polite live region. Pass false when a
   * parent already announces the log.
   */
  live?: boolean | undefined;
};

function ThinkingRow({ text, live = true, className, ...props }: ThinkingRowProps) {
  if (!text) return null;
  return (
    <div
      data-slot="thinking-row"
      className={cn("text-dense text-muted-foreground", className)}
      {...props}
    >
      <StreamText text={text} live={live} />
    </div>
  );
}

export type AssistantMessageProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** CommonMark source string. */
  children: string;
};

function AssistantMessage({ children, className, ...props }: AssistantMessageProps) {
  return (
    <div data-slot="assistant-message" className={cn(className)} {...props}>
      <Markdown>{children}</Markdown>
    </div>
  );
}

export type TranscriptBurstProps = React.ComponentProps<"div">;

/** Presentational slot matching `Stack gap="sm"`; pass `aria-label` to name the group. */
function TranscriptBurst({ className, ...props }: TranscriptBurstProps) {
  return (
    <div
      data-slot="transcript-burst"
      role="group"
      className={cn("flex flex-col gap-stack-sm", className)}
      {...props}
    />
  );
}

export { AssistantMessage, ThinkingRow, ToolCallRow, TranscriptBurst };
