import { DetailPanel, LivePulse, Stack } from "@zedtech/zedkit-ui";

export function DetailsDemo() {
  return (
    <Stack gap={3}>
      <DetailPanel
        items={[
          { label: "Region", value: "eu" },
          { label: "Plan", value: "team" },
        ]}
      />
      <Stack direction="horizontal" gap={4}>
        <LivePulse />
        <LivePulse active={false} />
      </Stack>
    </Stack>
  );
}
