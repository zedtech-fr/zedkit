"use client";

import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HomeInstallCommands } from "@/ui/home/home-install-commands";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_METADATA_TEXT_CLASS,
} from "@/ui/home/home-rhythm";

export function HomeInstallOrCopySection({
  packageInstallCmd,
  registryInstallCmd,
  registryComponentCount,
}: {
  packageInstallCmd: string;
  registryInstallCmd: string;
  registryComponentCount: number;
}) {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="install-or-copy" className="scroll-mt-24">
      <HomeInstallCommands
        packageInstallCmd={packageInstallCmd}
        registryInstallCmd={registryInstallCmd}
      />
      <Text className={HOME_METADATA_TEXT_CLASS}>
        <Link href="/docs" className="underline-offset-4 hover:underline">
          {registryComponentCount} components available in the registry → Catalog
        </Link>
      </Text>
      <Stack
        direction="horizontal"
        gap={3}
        className="flex-wrap items-center"
        data-docs-ctas=""
        data-install-next-steps=""
      >
        <Text className={HOME_METADATA_TEXT_CLASS}>Next steps:</Text>
        <Button asChild variant="ghost" size="sm" className="h-auto px-2 py-1">
          <Link href="/docs/zedkit-and-shadcn">
            <DocsActionLabel>zedkit and shadcn/ui</DocsActionLabel>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-auto px-2 py-1">
          <Link href="/docs/getting-started#install-or-copy">
            <DocsActionLabel>Getting started</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Stack>
  );
}
