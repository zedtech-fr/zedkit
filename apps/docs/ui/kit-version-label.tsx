import Link from "next/link";
import { LivePulse, Stack, Text } from "@zedtech/zedkit-ui";

/** UI kit version from generated gallery metadata; links to the package changelog on GitHub. */
export function KitVersionLabel({
  version,
  changelogHref,
}: {
  version: string;
  changelogHref: string;
}) {
  const label = `v${version} (UI kit changelog)`;
  return (
    <Stack direction="horizontal" gap={2} className="items-center leading-none">
      <LivePulse />
      <Link href={changelogHref} target="_blank" rel="noreferrer" aria-label={label}>
        <Text variant="muted" className="font-mono text-xs font-normal tabular-nums">
          v{version}
        </Text>
      </Link>
    </Stack>
  );
}
