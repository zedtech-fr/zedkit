"use client";

import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HomeUiQuickstartCopy } from "@/ui/home/home-ui-quickstart-copy";
import { HOME_CARD_CONTENT_GAP, HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

export function HomeGetStartedQuickstartBlock({
  npmInstallCmd,
  npmGlobalsCss,
  npmPageTsx,
  registryThemeAddCmd,
  registryAddCmd,
  registryPageTsx,
}: {
  npmInstallCmd: string;
  npmGlobalsCss: string;
  npmPageTsx: string;
  registryThemeAddCmd: string;
  registryAddCmd: string;
  registryPageTsx: string;
}) {
  const q = homeCopy.getStarted.quickstart;
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP}>
      <HomeUiQuickstartCopy
        npmInstallCmd={npmInstallCmd}
        npmGlobalsCss={npmGlobalsCss}
        npmPageTsx={npmPageTsx}
        registryThemeAddCmd={registryThemeAddCmd}
        registryAddCmd={registryAddCmd}
        registryPageTsx={registryPageTsx}
      />
      <Button asChild variant="outline" className="w-fit">
        <Link href="/docs/getting-started#ui-button">
          <DocsActionLabel>{q.openFullQuickstart}</DocsActionLabel>
        </Link>
      </Button>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {q.nextJsNoteBeforeGlobals}
        <Text as="span" className="font-mono">
          {q.nextJsGlobalsPath}
        </Text>
        {q.nextJsNoteMiddle}
        <Text as="span" className="font-mono">
          {q.nextJsSourceExample}
        </Text>
        {q.nextJsNoteInstead}
        <Text as="span" className="font-mono">
          {q.nextJsRelativeExample}
        </Text>
        {q.nextJsNoteEnd}
      </Text>
    </Stack>
  );
}
