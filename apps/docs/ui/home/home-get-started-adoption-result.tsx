"use client";

import { useState } from "react";
import { Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_TWO_COL,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SMALL_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { HomeCopyableCommand } from "@/ui/home/home-copyable-command";
import {
  HomeGetStartedPathTabs,
  HomeGetStartedStyledResult,
} from "@/ui/home/home-get-started-adoption-panels";

const IMPORT_SNIPPET = 'import { Button } from "@zedtech/zedkit-ui";';

export function HomeGetStartedAdoptionResult({
  packageInstallCmd,
  registryInstallCmd,
}: {
  packageInstallCmd: string;
  registryInstallCmd: string;
}) {
  const [path, setPath] = useState<"npm" | "registry">("npm");
  const installCmd = path === "npm" ? packageInstallCmd : registryInstallCmd;

  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} data-home-get-started-path="">
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        Install, import, then render — the same button you saw in the catalog docs.
      </Text>
      <div className={HOME_CARD_GRID_TWO_COL}>
        <Stack gap={3} className="min-w-0">
          <HomeGetStartedPathTabs path={path} onPath={setPath} />
          <HomeCopyableCommand
            value={installCmd}
            ariaLabel={path === "npm" ? "Package install command" : "shadcn registry add command"}
            copyLabel={path === "npm" ? "Copy package install command" : "Copy shadcn registry command"}
          />
          <div
            className={`${HOME_SMALL_TEXT_CLASS} rounded-md border border-border/80 bg-muted/20 p-3 font-mono`}
            aria-label="Import statement"
          >
            {IMPORT_SNIPPET}
          </div>
        </Stack>
        <HomeGetStartedStyledResult />
      </div>
    </Stack>
  );
}
