"use client";

import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { HomeCopyableCommand } from "@/ui/home/home-copyable-command";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";

export function HomeHeroAdoptionHint({ packageInstallCmd }: { packageInstallCmd: string }) {
  return (
    <Stack gap={2} className="w-full max-w-xl min-w-0" data-home-hero-adoption="">
      <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
        One command to add the kit:
      </Text>
      <HomeCopyableCommand
        value={packageInstallCmd}
        ariaLabel="Package install command"
        copyLabel="Copy package install command"
      />
    </Stack>
  );
}

export function HomeHeroLeadActions() {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap items-center" data-home-hero-actions>
      <Button asChild>
        <Link href="#get-started">Get started</Link>
      </Button>
      <Button asChild variant="link" className="h-11 px-2">
        <Link href="/catalog">Browse catalog</Link>
      </Button>
    </Stack>
  );
}
