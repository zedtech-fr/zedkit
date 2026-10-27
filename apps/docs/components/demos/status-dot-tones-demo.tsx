import { Stack, StatusDot, Text } from "@zedtech/zedkit-ui";

const SERVICES = [
  { name: "Checkout", tone: "success", label: "Operational" },
  { name: "Search", tone: "warning", label: "Retrying…" },
  { name: "Payments", tone: "danger", label: "Failed" },
  { name: "Image resizing", tone: "idle", label: "Idle" },
  { name: "Order export", tone: "active", label: "Running" },
] as const;

export function StatusDotTonesDemo() {
  return (
    <Stack gap={2}>
      {SERVICES.map((service) => (
        <Stack key={service.name} direction="horizontal" gap={2} className="items-center">
          <StatusDot tone={service.tone} />
          <Text>
            {service.name}: {service.label}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}
