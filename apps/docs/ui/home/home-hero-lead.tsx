"use client";

import { useState } from "react";
import {
  Button,
  Heading,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@zedtech/zedkit-ui";
import {
  AI_SETUP_MINI_PROMPT,
  MAP_SETUP_MINI_PROMPT,
  UI_SETUP_MINI_PROMPT,
} from "@/lib/ai-setup-onboarding.generated";
import { HomeCopyCommandField } from "@/ui/home/home-copy-command-field";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { HomeHeroIllustration } from "@/ui/home/home-hero-illustration";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import type { HeroKitId } from "@/ui/home/i18n/home-hero-copy";
import { OffPathLink } from "@/ui/off-path-link";

const PROMPTS = {
  ai: AI_SETUP_MINI_PROMPT,
  ui: UI_SETUP_MINI_PROMPT,
  combined: MAP_SETUP_MINI_PROMPT,
} as const;

function isHeroKit(value: string): value is HeroKitId {
  return value === "ai" || value === "ui" || value === "combined";
}

/**
 * Métier:           Public TypeScript kit: npm packages plus a docs site, not a hosted app with accounts.
 * Client personas:  Integrating developers and coding agents who adopt from the home first screen; they already have an agent and want one paste.
 * Customers:        The same visitors on a laptop (1440) or a phone (390).
 * Customer personas: Rushed (want the promise and the prompt without a product tour); doubtful (will follow a quiet proof link if it does not shout). Assumed from the existing hero-actions comment and `.agents/product.md`, not from interviews.
 * UI decisions:     Two-column hero from `lg` (copy | glass illustration) because the 1440 crop is that composition; stack copy then illustration on a phone because the 390 crop is headline-first and does not raise the card. Display h1 with a muted third clause because the mockup greys "From the agent you already use." Editorial paragraph with emphasized AI / UI because that is the mockup supporting copy. Kit Tabs for AI / UI / AI + UI because they are sibling setup prompts, not a primary CTA row. Shared copy-command field for the prompt because #246 asks for a single-line field with an attached black Copy, and closing must stay identical. Static glass card because the mockup right column is an illustration, not a live console. Tertiary OffPathLink because doubtful visitors still need proof and #117 must not be dropped without cause. No in-hero identity form because the dock is the identity surface (#110).
 */
export function HomeHeroLead({ issuesHref }: { issuesHref: string }) {
  const [kit, setKit] = useState<HeroKitId>("combined");
  const kits = homeCopy.heroKits;
  const caption = kit === "combined" ? homeCopy.hero.promptCaption : homeCopy.hero.promptCaptionSingle;

  return (
    <Tabs
      value={kit}
      onValueChange={(value) => {
        if (isHeroKit(value)) setKit(value);
      }}
      data-home-hero=""
      className="content-shrink"
    >
      <Stack gap="blocks" className="content-shrink items-start" data-home-hero-lead="">
        <Stack gap="sm" className="content-shrink items-start">
          <Text typeRole="label" className={`text-muted-foreground ${HOME_METADATA_TEXT_CLASS}`} data-home-hero-category="">
            {homeCopy.hero.titleCategory}
          </Text>
          <Heading level={1} typeRole="display">
            {homeCopy.hero.title}{" "}
            <span className="text-muted-foreground">{homeCopy.hero.titleClause}</span>
          </Heading>
        </Stack>
        <Text variant="muted" typeRole="lead" data-home-hero-sub="">
          {homeCopy.hero.subLead}{" "}
          <span className="font-semibold text-foreground">{homeCopy.hero.subAiName}</span> {homeCopy.hero.subAi}{" "}
          <span className="font-semibold text-foreground">{homeCopy.hero.subUiName}</span> {homeCopy.hero.subUi}
        </Text>
        <Stack gap={HOME_CARD_CONTENT_GAP} className="w-full items-start">
          <TabsList aria-label={kits.ariaLabel}>
            <TabsTrigger value="ai">{kits.ai}</TabsTrigger>
            <TabsTrigger value="ui">{kits.ui}</TabsTrigger>
            <TabsTrigger value="combined">{kits.combined}</TabsTrigger>
          </TabsList>
          <Stack className="w-full" data-home-hero-prompt="">
            {(["ai", "ui", "combined"] as const).map((id) => (
              <TabsContent key={id} value={id}>
                <HomeCopyCommandField
                  value={PROMPTS[id]}
                  aria-label={homeCopy.hero.promptAriaLabel}
                  copyLabel={homeCopy.hero.promptCopyLabel}
                />
              </TabsContent>
            ))}
          </Stack>
          <Text variant="muted" typeRole="caption" className={HOME_METADATA_TEXT_CLASS}>
            {caption}
          </Text>
          <span data-home-hero-actions="">
            <Button asChild variant="link" className="min-h-target px-control-tight">
              <OffPathLink href={issuesHref}>{homeCopy.heroActions.seeARealIssue}</OffPathLink>
            </Button>
          </span>
        </Stack>
      </Stack>
      <HomeHeroIllustration kit={kit} />
    </Tabs>
  );
}
