"use client";

import { useState } from "react";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SMALL_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { HomeCopyableCommand } from "@/ui/home/home-copyable-command";
import { HomeGetStartedPathTabs } from "@/ui/home/home-get-started-adoption-panels";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const IMPORT_SNIPPET = 'import { Button } from "@zedtech/zedkit-ui";';

export function HomeGetStartedAdoptionResult({
  packageInstallCmd,
  registryInstallCmd,
}: {
  packageInstallCmd: string;
  registryInstallCmd: string;
}) {
  const [path, setPath] = useState<"npm" | "registry">("npm");

  return (
    <Stack
      gap={HOME_CARD_CONTENT_GAP}
      id="install-or-copy"
      className="scroll-mt-24"
      data-home-get-started-path=""
    >
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {homeCopy.getStarted.adoption.lead}
      </Text>
      <Stack gap={3} className="min-w-0">
        <HomeGetStartedPathTabs path={path} onPath={setPath} />
        {path === "registry" ? (
          <HomeCopyableCommand
            value={registryInstallCmd}
            ariaLabel={homeCopy.getStarted.adoption.ariaRegistryInstall}
            copyLabel={homeCopy.getStarted.adoption.copyRegistryInstall}
          />
        ) : (
          <HomeCopyableCommand
            value={packageInstallCmd}
            ariaLabel={homeCopy.getStarted.adoption.ariaPackageInstall}
            copyLabel={homeCopy.getStarted.adoption.copyPackageInstall}
          />
        )}
        <div
          role="region"
          className={`${HOME_SMALL_TEXT_CLASS} rounded-md border border-border/80 bg-muted/20 p-3 font-mono`}
          aria-label={homeCopy.getStarted.adoption.importRegionAriaLabel}
        >
          {IMPORT_SNIPPET}
        </div>
        <Button type="button" tabIndex={-1} className="w-fit" data-home-get-started-result="">
          {homeCopy.getStarted.adoption.save}
        </Button>
      </Stack>
    </Stack>
  );
}
