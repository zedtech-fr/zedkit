import { Badge, Stack, Text } from "@zedtech/zedkit-ui";
import { badgeCopy } from "@/components/demos/i18n/badge-copy";

const JOBS = badgeCopy.softStatus.jobs;

export function BadgeSoftStatusDemo() {
  return (
    <Stack gap="md" className="content-shrink">
      <Text variant="muted">{badgeCopy.softStatus.subtitle}</Text>
      <Stack gap="sm">
        {JOBS.map((job) => (
          <Stack key={job.name} direction="horizontal" gap="md" className="items-center justify-between">
            <Text>{job.name}</Text>
            <Badge variant={job.variant}>{job.badge}</Badge>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
