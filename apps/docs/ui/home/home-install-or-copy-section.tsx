"use client";

import Link from "next/link";
import { Stack, Text } from "@zedtech/zedkit-ui";
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
    </Stack>
  );
}
