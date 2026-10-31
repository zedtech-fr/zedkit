"use client";

import Link from "next/link";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HomeUiQuickstartCopy } from "@/ui/home/home-ui-quickstart-copy";
import { HOME_CARD_CONTENT_GAP, HOME_PERSUASION_TEXT_CLASS } from "@/ui/home/home-rhythm";

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
        <Link href="/docs/getting-started#quickstart">
          <DocsActionLabel>Open the full UI quickstart</DocsActionLabel>
        </Link>
      </Button>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        Next.js apps: in <Text as="span" className="font-mono">src/app/globals.css</Text>, use{" "}
        <Text as="span" className="font-mono">@source &quot;../../node_modules/…&quot;</Text> instead of{" "}
        <Text as="span" className="font-mono">../node_modules</Text>.
      </Text>
    </Stack>
  );
}
