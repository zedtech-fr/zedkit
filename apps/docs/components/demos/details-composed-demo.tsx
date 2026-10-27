import { Badge, Button, DetailPanelRow, Stack, StatusDot, Text } from "@zedtech/zedkit-ui";

/** Rows with custom content (badge, dot, button) inside your own definition list. */
export function DetailsComposedDemo() {
  return (
    <dl className="divide-y divide-border rounded-lg border">
      <DetailPanelRow label="Customer" value="Camille Rousseau" />
      <DetailPanelRow label="Plan" value={<Badge variant="success">Pro</Badge>} />
      <DetailPanelRow
        label="Last seen"
        value={
          <Stack direction="horizontal" gap={2}>
            <StatusDot tone="success" />
            <Text>2 minutes ago</Text>
          </Stack>
        }
      />
      <DetailPanelRow label="Renews" value="1 December 2026" />
      <DetailPanelRow
        label="Customer ID"
        value={
          <Button size="sm" variant="outline">
            Copy cus_4821
          </Button>
        }
      />
    </dl>
  );
}
