"use client";

import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { HomeInstallOrCopyCopy } from "@/ui/home/home-install-or-copy-copy";
import { DocsActionLabel } from "@/components/docs-action-label";
import { RegistryBrickList } from "@/components/registry-brick-name";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS, HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";

export function HomeGetStartedInstallBlock({
  packageInstallCmd,
  registryAddCmd,
  registryBricks,
}: {
  packageInstallCmd: string;
  registryAddCmd: string;
  registryBricks: string[];
}) {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="install-or-copy" className="scroll-mt-24">
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        npm packages for the full kit, or copy UI bricks with the shadcn CLI when you have a{" "}
        <Text as="span" className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}>components.json</Text>.
      </Text>
      <HomeInstallOrCopyCopy packageInstallCmd={packageInstallCmd} registryAddCmd={registryAddCmd} />
      <Text className={HOME_METADATA_TEXT_CLASS}>
        Published registry bricks today: <RegistryBrickList names={registryBricks} />.
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap" data-docs-ctas="">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/zedkit-and-shadcn">
            <DocsActionLabel>zedkit and shadcn/ui</DocsActionLabel>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/getting-started#install-or-copy">
            <DocsActionLabel>Getting started</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Stack>
  );
}
