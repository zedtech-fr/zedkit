"use client";

import { OffPathLink } from "@/ui/off-path-link";
import { Button } from "@zedtech/zedkit-ui";
import { homeCopy } from "@/ui/home/i18n/home-copy";

/**
 * Tertiary proof link after the prompt caption. Doubtful visitors still need
 * a quiet path to a real issue; it is not a hero CTA row (#117, #118).
 */
export function HomeHeroLeadActions({ issuesHref }: { issuesHref: string }) {
  return (
    <span data-home-hero-actions="">
      <Button asChild variant="link" className="min-h-target px-control-tight">
        <OffPathLink href={issuesHref}>{homeCopy.heroActions.seeARealIssue}</OffPathLink>
      </Button>
    </span>
  );
}
