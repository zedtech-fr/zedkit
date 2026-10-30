import Link from "next/link";
import { LivePulse, Stack, Text } from "@zedtech/zedkit-ui";

/** UI kit version from generated gallery metadata; links to the dated releases list. */
export function KitVersionLabel({
  version,
  releasesHref,
}: {
  version: string;
  releasesHref: string;
}) {
  const label = `v${version} (releases)`;
  return (
    <Stack direction="horizontal" gap={2} className="items-center">
      <LivePulse label="Latest" />
      <Link href={releasesHref} target="_blank" rel="noreferrer" aria-label={label}>
        <Text variant="muted" className="font-mono text-sm">
          v{version}
        </Text>
      </Link>
    </Stack>
  );
}
