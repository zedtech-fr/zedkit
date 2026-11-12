import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { MAP_AI_UI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { HomeCopyCommandField } from "@/ui/home/home-copy-command-field";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import { HomeHeroIllustration } from "@/ui/home/home-hero-illustration";
import { homeHeroCopy } from "@/ui/home/i18n/home-hero-copy";

/**
 * Métier:           Public TypeScript kit: npm packages plus a docs site, not a hosted app with accounts.
 * Client personas:  Integrating developers and coding agents who adopt from the home first screen; they already have an agent and want one paste.
 * Customers:        The same visitors on a laptop (1440) or a phone (390).
 * Customer personas: Rushed (want the promise and the prompt without a product tour). Assumed from `.agents/product.md`, not from interviews. Doubtful visitors still reach the public run history page, not from a hero link.
 * UI decisions:     Two-column hero from `lg` (copy | glass illustration) because the 1440 crop is that composition; stack copy then illustration on a phone because the 390 crop is headline-first and does not raise the card. Display h1 with a muted third clause because the mockup greys "From the agent you already use." Editorial paragraph with emphasized AI / UI because that is the mockup supporting copy. One map prompt and one caption, because map.md is how the agent chooses kits, and the owner dropped the mockup pills (#73 adjustment). Shared wrapping copy-command field for the AI-and-UI prompt because the mockup wraps and visitors must read the sentence they paste; closing stays identical. Static glass card because the mockup right column is an illustration, not a live console. No issues link in the hero because the mockup first screen has none and #247 supersedes #117 for that placement. No band glow discs because the mockup hero is a flat light band and the only colour is the purple stage. No in-hero identity form because the dock is the identity surface (#110).
 */
export function HomeHeroLead() {
  return (
    <div data-home-hero="" className="content-shrink">
      <Stack gap="blocks" className="content-shrink items-start" data-home-hero-lead="">
        <Stack gap="sm" className="content-shrink items-start">
          <Text typeRole="label" className={`text-muted-foreground ${HOME_METADATA_TEXT_CLASS}`} data-home-hero-category="">
            {homeHeroCopy.hero.titleCategory}
          </Text>
          <Heading level={1} typeRole="display">
            {homeHeroCopy.hero.title}{" "}
            <span className="text-muted-foreground">{homeHeroCopy.hero.titleClause}</span>
          </Heading>
        </Stack>
        <Text variant="muted" typeRole="lead" data-home-hero-sub="">
          {homeHeroCopy.hero.subLead}{" "}
          <span className="font-semibold text-foreground">{homeHeroCopy.hero.subAiName}</span> {homeHeroCopy.hero.subAi}{" "}
          <span className="font-semibold text-foreground">{homeHeroCopy.hero.subUiName}</span> {homeHeroCopy.hero.subUi}
        </Text>
        <Stack gap={HOME_CARD_CONTENT_GAP} className="w-full items-start">
          <Stack className="w-full" data-home-hero-prompt="">
            <HomeCopyCommandField
              value={MAP_AI_UI_SETUP_MINI_PROMPT}
              aria-label={homeHeroCopy.hero.promptAriaLabel}
              aria-describedby="home-hero-prompt-caption"
              copyLabel={homeHeroCopy.hero.promptCopyLabel}
            />
          </Stack>
          <Text
            id="home-hero-prompt-caption"
            variant="muted"
            typeRole="caption"
            className={HOME_METADATA_TEXT_CLASS}
          >
            {homeHeroCopy.hero.promptCaption}
          </Text>
        </Stack>
      </Stack>
      <HomeHeroIllustration />
    </div>
  );
}
