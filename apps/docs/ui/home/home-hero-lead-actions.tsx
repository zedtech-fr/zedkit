"use client";

import { HomeLink } from "@/ui/home/home-link";
import { OffPathLink } from "@/ui/off-path-link";
import { Button, Stack } from "@zedtech/zedkit-ui";
import { homeCopy } from "@/ui/home/i18n/home-copy";

/**
 * Métier: public TypeScript kit (packages + docs), not a hosted app with accounts.
 * Client personas: integrating developers and coding agents adopting from the home first screen.
 * Customers: the same visitors; phone and laptop.
 * Customer personas: rushed, want one next step (Setup); doubtful, will click a quiet proof link if it does not shout.
 * UI decisions: one primary Setup (site-action) because paste then jump to #ai-setup; tertiary issues link because doubtful visitor wants proof without a nav item; new-tab mark because a same-origin path still leaves the adoption path; near-black buttons because chrome must not wear Glass indigo.
 */
export function HomeHeroLeadActions({ issuesHref }: { issuesHref: string }) {
  return (
    <Stack direction="horizontal" gap="sm" className="flex-wrap items-center" data-home-hero-actions>
      <Button asChild data-site-action="">
        <HomeLink href="#ai-setup">{homeCopy.heroActions.setup}</HomeLink>
      </Button>
      <Button asChild variant="outline" data-site-action="">
        <HomeLink href="#get-started">{homeCopy.heroActions.getStarted}</HomeLink>
      </Button>
      <Button asChild variant="link" className="min-h-target px-control-tight">
        <HomeLink href="/catalog">{homeCopy.heroActions.browseCatalog}</HomeLink>
      </Button>
      <Button asChild variant="link" className="min-h-target px-control-tight">
        <OffPathLink href={issuesHref}>{homeCopy.heroActions.seeARealIssue}</OffPathLink>
      </Button>
    </Stack>
  );
}
