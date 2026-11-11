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

/** Dense collapsed tools because the operator is scanning a live log on a phone. */
export function TranscriptRowsDemo() {
  return (
    <Stack gap="sm">
      <ThinkingRow text="Checking open invoices." live={false} />
      <ToolCallRow
        name="listInvoices"
        status={<StatusLabel tone="saved">Done</StatusLabel>}
        duration={formatDuration(4_000)}
      >
        {`{"status":"open"}`}
      </ToolCallRow>
      <AssistantMessage>{"Found **three** open invoices."}</AssistantMessage>
    </Stack>
  );
}

const burstItems = [
  { kind: "tool" as const, name: "searchDocs", body: "query: refunds" },
  { kind: "tool" as const, name: "readFile", body: "path: refunds.md" },
  { kind: "assistant" as const, name: "", body: "Refunds take 5 to 7 days." },
];

export function TranscriptRowsBurstDemo() {
  return (
    <Stack gap="sm">
      {groupToolCallBursts(burstItems).map((group, index) =>
        group.type === "burst" ? (
          <TranscriptBurst key={index}>
            {group.items.map((item) => (
              <ToolCallRow key={item.name} name={item.name}>
                {item.body}
              </ToolCallRow>
            ))}
          </TranscriptBurst>
        ) : group.item.kind === "tool" ? (
          <ToolCallRow key={index} name={group.item.name}>
            {group.item.body}
          </ToolCallRow>
        ) : (
          <AssistantMessage key={index}>{group.item.body}</AssistantMessage>
        ),
      )}
    </Stack>
  );
}
