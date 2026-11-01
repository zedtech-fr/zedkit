"use client";

import { useState } from "react";
import {
  Button,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import {
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { HomeCopyableCommand } from "@/ui/home/home-copyable-command";
import { homeCopy } from "@/ui/home/i18n/home-copy";

type InstallPath = "npm" | "registry";

export function HomeInstallCommands({
  packageInstallCmd,
  registryInstallCmd,
}: {
  packageInstallCmd: string;
  registryInstallCmd: string;
}) {
  const [path, setPath] = useState<InstallPath>("npm");
  const command = path === "npm" ? packageInstallCmd : registryInstallCmd;
  const commandLabel =
    path === "npm"
      ? homeCopy.getStarted.install.ariaPackageInstall
      : homeCopy.getStarted.install.ariaRegistryInstall;
  const copyLabel =
    path === "npm"
      ? homeCopy.getStarted.install.copyPackageInstall
      : homeCopy.getStarted.install.copyRegistryInstall;

  return (
    <Stack gap={3} data-home-install-choice="">
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center" role="tablist" aria-label={homeCopy.getStarted.install.pathTabsAriaLabel}>
        <Button
          type="button"
          role="tab"
          aria-selected={path === "npm"}
          variant={path === "npm" ? "secondary" : "ghost"}
          size="sm"
          className="min-h-11"
          onClick={() => setPath("npm")}
        >
          {homeCopy.getStarted.install.pathNpmPackage}
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={path === "registry"}
          variant={path === "registry" ? "secondary" : "ghost"}
          size="sm"
          className="min-h-11"
          onClick={() => setPath("registry")}
        >
          {homeCopy.getStarted.install.pathCopySource}
        </Button>
      </Stack>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {path === "npm" ? homeCopy.getStarted.install.npmHint : homeCopy.getStarted.install.registryHint}
      </Text>
      <HomeCopyableCommand value={command} ariaLabel={commandLabel} copyLabel={copyLabel} />
    </Stack>
  );
}
