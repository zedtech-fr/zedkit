"use client";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Command scroll regions need keyboard focus (scrollable-region-focusable; see packages/ui/table.tsx). */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from "@zedtech/zedkit-ui";
import {
  HOME_CARD_GRID_TWO_COL,
  HOME_CARD_TITLE_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SMALL_TEXT_CLASS,
} from "@/ui/home/home-rhythm";

function InstallCommandBlock({
  value,
  ariaLabel,
  copyLabel,
}: {
  value: string;
  ariaLabel: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = (): void => {
    const clipboard = navigator.clipboard;
    if (!clipboard) return;
    clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  };

  return (
    <div
      data-install-command=""
      className="relative min-w-0 rounded-md border border-input bg-muted/30"
    >
      <div
        tabIndex={0}
        role="region"
        className={`${HOME_SMALL_TEXT_CLASS} overflow-x-auto p-3 pr-12 font-mono leading-relaxed whitespace-nowrap`}
        aria-label={ariaLabel}
      >
        <pre className="m-0 font-[inherit] leading-[inherit] whitespace-nowrap text-[inherit]">{value}</pre>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-2 right-2"
        aria-label={copyLabel}
        onClick={copy}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </Button>
    </div>
  );
}

function InstallPathCard({
  title,
  description,
  command,
  commandLabel,
  copyLabel,
}: {
  title: string;
  description: string;
  command: string;
  commandLabel: string;
  copyLabel: string;
}) {
  return (
    <Card className="flex h-full min-w-0 flex-col" data-install-path-card="">
      <CardHeader className="gap-2 pb-0">
        <CardTitle className={HOME_CARD_TITLE_CLASS}>{title}</CardTitle>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {description}
        </Text>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end pt-4">
        <InstallCommandBlock value={command} ariaLabel={commandLabel} copyLabel={copyLabel} />
      </CardContent>
    </Card>
  );
}

export function HomeInstallCommands({
  packageInstallCmd,
  registryInstallCmd,
}: {
  packageInstallCmd: string;
  registryInstallCmd: string;
}) {
  return (
    <div className={`${HOME_CARD_GRID_TWO_COL} items-stretch`}>
      <InstallPathCard
        title="Install as packages"
        description="Full kit on npm — one import surface and theme CSS from the package."
        command={packageInstallCmd}
        commandLabel="Package install command"
        copyLabel="Copy package install command"
      />
      <InstallPathCard
        title="Copy via shadcn registry"
        description="Paste component source into your repo when you already use the shadcn CLI."
        command={registryInstallCmd}
        commandLabel="shadcn registry add command"
        copyLabel="Copy shadcn registry command"
      />
    </div>
  );
}
