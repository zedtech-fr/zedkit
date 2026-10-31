"use client";

import { Heading, Stack } from "@zedtech/zedkit-ui";
import { HomeGetStartedAiBlock } from "@/ui/home/home-get-started-ai-block";
import { HomeGetStartedInstallBlock } from "@/ui/home/home-get-started-install-block";
import { HomeGetStartedQuickstartBlock } from "@/ui/home/home-get-started-quickstart-block";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

export function HomeGetStartedCopy({
  initCommand,
  packageInstallCmd,
  registryInstallCmd,
  registryComponentCount,
  registryAddCmd,
  npmInstallCmd,
  npmGlobalsCss,
  npmPageTsx,
  registryThemeAddCmd,
  registryPageTsx,
}: {
  initCommand: string;
  packageInstallCmd: string;
  registryInstallCmd: string;
  registryComponentCount: number;
  registryAddCmd: string;
  npmInstallCmd: string;
  npmGlobalsCss: string;
  npmPageTsx: string;
  registryThemeAddCmd: string;
  registryPageTsx: string;
}) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="w-full min-w-0">
      <Heading level={3}>Install it or copy it</Heading>
      <HomeGetStartedInstallBlock
        packageInstallCmd={packageInstallCmd}
        registryInstallCmd={registryInstallCmd}
        registryComponentCount={registryComponentCount}
      />
      <Heading level={3} id="quickstart" className="scroll-mt-24">
        UI quickstart
      </Heading>
      <HomeGetStartedQuickstartBlock
        npmInstallCmd={npmInstallCmd}
        npmGlobalsCss={npmGlobalsCss}
        npmPageTsx={npmPageTsx}
        registryThemeAddCmd={registryThemeAddCmd}
        registryAddCmd={registryAddCmd}
        registryPageTsx={registryPageTsx}
      />
      <Heading level={3}>Set up your coding agent</Heading>
      <HomeGetStartedAiBlock initCommand={initCommand} />
    </Stack>
  );
}
