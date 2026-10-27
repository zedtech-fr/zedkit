import { Badge, Stack, Text } from "@zedtech/zedkit-ui";

const RUNS = [
  { name: "Deploy to staging", badge: <Badge variant="outline">3 retries</Badge> },
  { name: "Nightly orders export", badge: <Badge variant="destructive">failed</Badge> },
  { name: "Image optimisation", badge: <Badge variant="secondary">queued</Badge> },
  { name: "Storefront build", badge: <Badge>passed</Badge> },
];

export function BadgeVariantsDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Text variant="muted">Pipeline runs for Harbor Studio, last 24 hours</Text>
      <Stack gap={2}>
        {RUNS.map((run) => (
          <Stack key={run.name} direction="horizontal" gap={3} className="items-center justify-between">
            <Text>{run.name}</Text>
            {run.badge}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
