import Link from "next/link";
import { LivePulse, Stack, Text } from "@zedtech/zedkit-ui";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";

/** UI kit version from generated gallery metadata; hero links to releases, shell is caption-only. */
export function KitVersionLabel({
  version,
  releasesHref,
  tone = "hero",
}: {
  version: string;
  releasesHref: string;
  /** `shell` drops the pulse — one quiet caption beside the logo. */
  tone?: "hero" | "shell";
}) {
  return (
    <Stack direction="horizontal" gap="sm" className="items-center">
      {tone === "hero" ? <LivePulse label={siteChromeCopy.version.latest} /> : null}
      {tone === "shell" ? (
        <Text as="span" variant="muted" data-kit-version="" className="font-mono text-caption tabular-nums">
          {siteChromeCopy.version.shell(version)}
        </Text>
      ) : (
        <Link href={releasesHref} target="_blank" rel="noreferrer" aria-label={siteChromeCopy.version.releasesAriaLabel(version)} className="inline-flex min-h-overlay-touch-target items-center px-touch">
          <Text variant="muted" className="font-mono">
            {siteChromeCopy.version.shell(version)}
          </Text>
        </Link>
      )}
    </Stack>
  );
}
