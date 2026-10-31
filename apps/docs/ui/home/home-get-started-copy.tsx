"use client";

import { Heading, Stack } from "@zedtech/zedkit-ui";
import { HomeGetStartedAiBlock } from "@/ui/home/home-get-started-ai-block";
import { HomeGetStartedInstallBlock } from "@/ui/home/home-get-started-install-block";
import { HomeGetStartedQuickstartBlock } from "@/ui/home/home-get-started-quickstart-block";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

export function HomeGetStartedCopy({
  initCommand,
  packageInstallCmd,
  registryAddCmd,
  registryBricks,
}: {
  initCommand: string;
  packageInstallCmd: string;
  registryAddCmd: string;
  registryBricks: string[];
}) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="w-full min-w-0">
      <Heading level={3}>Set up your coding agent</Heading>
      <HomeGetStartedAiBlock initCommand={initCommand} />
      <Heading level={3}>Install it or copy it</Heading>
      <HomeGetStartedInstallBlock
        packageInstallCmd={packageInstallCmd}
        registryAddCmd={registryAddCmd}
        registryBricks={registryBricks}
      />
      <Heading level={3}>UI quickstart</Heading>
      <HomeGetStartedQuickstartBlock />
    </Stack>
  );
}
