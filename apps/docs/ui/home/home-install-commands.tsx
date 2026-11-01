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
  const commandLabel = path === "npm" ? "Package install command" : "shadcn registry add command";
  const copyLabel =
    path === "npm" ? "Copy package install command" : "Copy shadcn registry command";

  return (
    <Stack gap={3} data-home-install-choice="">
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center" role="tablist" aria-label="Install path">
        <Button
          type="button"
          role="tab"
          aria-selected={path === "npm"}
          variant={path === "npm" ? "secondary" : "ghost"}
          size="sm"
          className="min-h-11"
          onClick={() => setPath("npm")}
        >
          npm package
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
          Copy source
        </Button>
      </Stack>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {path === "npm"
          ? "Full kit on npm — one import surface and theme CSS from the package."
          : "Paste component source into your repo when you already use the shadcn CLI."}
      </Text>
      <HomeCopyableCommand value={command} ariaLabel={commandLabel} copyLabel={copyLabel} />
    </Stack>
  );
}
