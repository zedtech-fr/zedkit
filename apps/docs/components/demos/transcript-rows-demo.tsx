import {
  AssistantMessage,
  StatusLabel,
  Stack,
  ThinkingRow,
  ToolCallRow,
  TranscriptBurst,
  formatDuration,
  groupToolCallBursts,
} from "@zedtech/zedkit-ui";

const TOOL_DURATION = formatDuration(64_000);

/** Dense collapsed tools because the operator is scanning a live log on a phone. */
export function TranscriptRowsDemo() {
  return (
    <Stack gap="sm">
      <ThinkingRow text="Checking open invoices." />
      <ToolCallRow
        name="listInvoices"
        status={<StatusLabel tone="saved">Done</StatusLabel>}
        duration={TOOL_DURATION}
      >
        {`{"status":"open"}`}
      </ToolCallRow>
      <ToolCallRow
        name="searchDocs"
        status={<StatusLabel tone="loading">Running searchDocs…</StatusLabel>}
      >
        {`query: refunds`}
      </ToolCallRow>
      <AssistantMessage>{"Found **three** open invoices."}</AssistantMessage>
    </Stack>
  );
}

const burstItems = [
  { kind: "tool" as const, id: "searchDocs", name: "searchDocs", body: "query: refunds" },
  { kind: "tool" as const, id: "readFile", name: "readFile", body: "path: refunds.md" },
  { kind: "assistant" as const, id: "reply", name: "", body: "Refunds take 5 to 7 days." },
  { kind: "tool" as const, id: "listRefunds", name: "listRefunds", body: "status: open" },
];

export function TranscriptRowsBurstDemo() {
  return (
    <Stack gap="sm">
      {groupToolCallBursts(burstItems).map((group) =>
        group.type === "burst" ? (
          <TranscriptBurst key={group.items.map((item) => item.id).join("-")} aria-label="Tool calls">
            {group.items.map((item) => (
              <ToolCallRow key={item.id} name={item.name}>
                {item.body}
              </ToolCallRow>
            ))}
          </TranscriptBurst>
        ) : group.item.kind === "tool" ? (
          <ToolCallRow key={group.item.id} name={group.item.name}>
            {group.item.body}
          </ToolCallRow>
        ) : (
          <AssistantMessage key={group.item.id}>{group.item.body}</AssistantMessage>
        ),
      )}
    </Stack>
  );
}
