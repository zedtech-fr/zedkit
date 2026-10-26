import { DetailPanel, DetailPanelRow, LivePulse, Stack } from "@zedtech/zedkit-ui";

export function DetailsDemo() {
  return (
    <Stack gap={3}>
      <DetailPanel
        items={[
          { label: "Region", value: "eu" },
          { label: "Plan", value: "team" },
        ]}
      />
      <dl className="divide-y divide-border rounded-lg border">
        <DetailPanelRow label="Region" value="eu" />
      </dl>
      <Stack direction="horizontal" gap={4}>
        <LivePulse />
        <LivePulse active={false} />
      </Stack>
    </Stack>
  );
}
