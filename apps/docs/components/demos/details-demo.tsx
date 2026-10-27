import { Badge, DetailPanel, Heading, LivePulse, Stack, Text } from "@zedtech/zedkit-ui";

/** A parcel tracking panel: title with a live indicator, then the key-value details. */
export function DetailsDemo() {
  return (
    <Stack gap={4}>
      <Stack direction="horizontal" gap={3}>
        <Heading level={3}>Delivery D-2047</Heading>
        <LivePulse label="Tracking live" />
      </Stack>
      <DetailPanel
        items={[
          { label: "Carrier", value: "Colissimo" },
          { label: "Status", value: <Badge variant="secondary">In transit</Badge> },
          { label: "Destination", value: "14 rue des Lilas, 69003 Lyon" },
          { label: "Arrival", value: "Thursday 29 October, before 6 pm" },
          { label: "Weight", value: "1.8 kg" },
        ]}
      />
      <Stack direction="horizontal" gap={3}>
        <LivePulse active={false} />
        <Text variant="muted">Shown once tracking stops, for example after delivery.</Text>
      </Stack>
    </Stack>
  );
}
