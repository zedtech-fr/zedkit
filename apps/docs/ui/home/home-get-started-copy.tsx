"use client";

import { HomeGetStartedAdoptionResult } from "@/ui/home/home-get-started-adoption-result";
import { HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";
import { Stack } from "@zedtech/zedkit-ui";

export function HomeGetStartedCopy({
  packageInstallCmd,
  registryInstallCmd,
}: {
  packageInstallCmd: string;
  registryInstallCmd: string;
}) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="w-full min-w-0">
      <HomeGetStartedAdoptionResult
        packageInstallCmd={packageInstallCmd}
        registryInstallCmd={registryInstallCmd}
      />
    </Stack>
  );
}
