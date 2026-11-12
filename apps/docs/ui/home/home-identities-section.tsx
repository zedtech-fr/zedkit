import { Section, Stack } from "@zedtech/zedkit-ui";
import { HomeIdentityLooks } from "@/ui/home/home-identity-looks";
import { HomeYoursScene } from "@/ui/home/home-yours-scene";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";

/**
 * Comparison: the same product screen in four looks, after paste and before limits.
 *
 * Compose-UI: two columns from lg (specimen | title + look-name pills +
 * data-identity caption), because: client = hurried integrator; one focal
 * specimen, controls recede. One compact Project settings screen restyled
 * as Glass, Mist, Press, Maison, because a look is type+shape+density+color
 * together. Copy+pills first on a phone, because the first control must
 * stay reachable. No identity form here: the dock owns customization.
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
        <HomeYoursScene />
      </Stack>
    </Section>
  );
}
