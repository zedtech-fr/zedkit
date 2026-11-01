"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SMALL_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { HomeCopyableCommand } from "@/ui/home/home-copyable-command";
import { HomeGetStartedPathTabs } from "@/ui/home/home-get-started-adoption-panels";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const { adoption } = homeCopy.getStarted;

export function HomeGetStartedAdoptionResult({
  packageInstallCmd,
  registryInstallCmd,
}: {
  packageInstallCmd: string;
  registryInstallCmd: string;
}) {
  const [path, setPath] = useState<"npm" | "registry">("npm");
  const npm = path === "npm";

  return (
    <Stack
      gap={HOME_CARD_CONTENT_GAP}
      id="install-or-copy"
      className="scroll-mt-24"
      data-home-get-started-path=""
    >
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {adoption.lead}
      </Text>
      <Stack gap={3} className="min-w-0">
        <HomeGetStartedPathTabs path={path} onPath={setPath} />
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS} data-home-path-hint="">
          {npm ? adoption.npmHint : adoption.registryHint}
        </Text>
        <HomeCopyableCommand
          value={npm ? packageInstallCmd : registryInstallCmd}
          ariaLabel={npm ? adoption.ariaPackageInstall : adoption.ariaRegistryInstall}
          copyLabel={npm ? adoption.copyPackageInstall : adoption.copyRegistryInstall}
        />
        <div
          role="region"
          className={`${HOME_SMALL_TEXT_CLASS} overflow-x-auto rounded-md border border-border/80 bg-muted/20 p-3 font-mono`}
          aria-label={adoption.importRegionAriaLabel}
          data-home-import=""
        >
          {npm ? adoption.importNpm : adoption.importRegistry}
        </div>
        <Button type="button" tabIndex={-1} className="w-fit" data-home-get-started-result="">
          {adoption.save}
        </Button>
        <Text className={HOME_METADATA_TEXT_CLASS}>
          <Link href="/docs/getting-started" className="underline-offset-4 hover:underline" data-home-full-setup="">
            {npm ? adoption.fullSetupNpm : adoption.fullSetupRegistry}
          </Link>
        </Text>
      </Stack>
    </Stack>
  );
}
