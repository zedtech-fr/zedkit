import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { MAP_AI_UI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { HomeCopyCommandField } from "./home-copy-command-field";
import { HOME_METADATA_TEXT_CLASS } from "./home-rhythm";
import { HomeHeroIllustration } from "./home-hero-illustration";
import { homeHeroCopy } from "./i18n/home-hero-copy";

/**
 * Métier:           Public TypeScript kit: npm packages plus a docs site, not a hosted app with accounts.
 * Client personas:  Integrating developers and coding agents who adopt from the home first screen; they already have an agent and want one paste.
 * Customers:        The same visitors on a laptop (1440) or a phone (390).
 * Customer personas: Rushed (want the promise and the prompt without a product tour). Assumed from `.agents/product.md`, not from interviews. Doubtful visitors reach the public run history page from the illustration caption, not from a lead CTA.
 * UI decisions:     Two-column hero from `lg` (copy | glass illustration) because the 1440 crop is that composition; stack copy then illustration on a phone because the 390 crop is headline-first and does not raise the card. Display h1 uses a `clamp()` on `--zk-type-h1-size` because a fixed 48px eats the first screen on a phone. Stacked illustration uses `--zk-home-hero-stack` row-gap, because the lead sat flush on the card. Display h1 with a muted third clause because the mockup greys "From the agent you already use." One muted `body` sentence under the title because a lead paragraph with bold AI / UI blocks competed with the h1 and the prompt. One map prompt and no caption, because map.md is how the agent chooses kits, Nest lives in Together, and the owner dropped the mockup pills (#73 adjustment). Shared wrapping copy-command field for the AI-and-UI prompt because the mockup wraps and visitors must read the sentence they paste; closing stays identical. Glass card because the mockup right column is that illustration, not a live console: first paint is the static placeholder; a client fetch swaps in one active run when `active` and not `stale`, and empty or failed fetches keep the placeholder (because: doubtful visitors still see a finished card). No issues CTA in the lead column because the mockup first screen has none and #247 supersedes #117 for that placement; the illustration card footer links to the public run list or to that live run. No band glow discs because the mockup hero is a flat light band and the only colour is the purple stage. No in-hero identity form because the dock is the identity surface (#110).
 */
export function HomeHeroLead() {
  return (
    <div data-home-hero="" className="content-shrink">
      <Stack gap="list" className="content-shrink items-start" data-home-hero-lead="">
        <Stack gap="sm" className="content-shrink items-start">
          <Text typeRole="label" className={`text-muted-foreground ${HOME_METADATA_TEXT_CLASS}`} data-home-hero-category="">
            {homeHeroCopy.hero.titleCategory}
          </Text>
          <Heading level={1} typeRole="display">
            {homeHeroCopy.hero.title}{" "}
            <span className="text-muted-foreground">{homeHeroCopy.hero.titleClause}</span>
          </Heading>
        </Stack>
        <Text typeRole="body" className="text-muted-foreground" data-home-hero-sub="">
          {homeHeroCopy.hero.sub}
        </Text>
        <Stack className="w-full" data-home-hero-prompt="">
          <HomeCopyCommandField
            value={MAP_AI_UI_SETUP_MINI_PROMPT}
            aria-label={homeHeroCopy.hero.promptAriaLabel}
            copyLabel={homeHeroCopy.hero.promptCopyLabel}
          />
        </Stack>
      </Stack>
      <HomeHeroIllustration />
    </div>
  );
}
