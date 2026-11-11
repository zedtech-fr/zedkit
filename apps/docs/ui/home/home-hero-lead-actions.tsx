"use client";

import { HomeLink } from "@/ui/home/home-link";
import { Button, Stack } from "@zedtech/zedkit-ui";
import { homeCopy } from "@/ui/home/i18n/home-copy";

export function HomeHeroLeadActions() {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-center" data-home-hero-actions>
      <Button asChild>
        <HomeLink href="#ai-setup">{homeCopy.heroActions.setup}</HomeLink>
      </Button>
      <Button asChild variant="outline">
        <HomeLink href="#get-started">{homeCopy.heroActions.getStarted}</HomeLink>
      </Button>
      <Button asChild variant="link" className="min-h-target px-control-tight">
        <HomeLink href="/catalog">{homeCopy.heroActions.browseCatalog}</HomeLink>
      </Button>
    </Stack>
  );
}
