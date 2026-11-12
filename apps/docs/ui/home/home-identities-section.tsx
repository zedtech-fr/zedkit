import { Section, Stack } from "@zedtech/zedkit-ui";
import { HomeIdentityLooks } from "@/ui/home/home-identity-looks";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";

/**
 * Comparison: a different product in each look, after paste and before limits.
 *
 * Compose-UI: two columns from lg (specimen | title + look-name pills +
 * data-identity caption), because: client = hurried integrator; one focal
 * specimen, controls recede. Three live product screens, not one settings
 * card, because a look is type+shape+density+color together. Copy+pills
 * first on a phone, because the first control must stay reachable. Glass
 * stays on the page and hero, not a fourth pill.
 */
export function HomeIdentitiesSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="identities"
      aria-labelledby="identities-heading"
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack id="use-cases" gap={HOME_SECTION_CONTENT_GAP} data-scroll-anchor="">
        <HomeIdentityLooks />
      </Stack>
    </Section>
  );
}
