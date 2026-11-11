import { Button, Section, Stack } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { SetupEntryPrompt } from "@/components/setup-entry-prompt";
import { HomeLink } from "@/ui/home/home-link";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homePasteCopy } from "@/ui/home/i18n/home-paste-copy";

/**
 * One combined map paste after the same-idea band. Aliases keep README and
 * current hero hashes landing on a paste until the shortened-hero ticket retargets them.
 *
 * Compose-UI: one SecretField (combined/map) plus a quiet Getting started
 * link, because the mockup is one line and the generated prompt contract
 * forbids tabs or a second AI-only paste. Hash aliases are named stacks
 * inside the band, because native id is enough. Adoption tabs stay on
 * Getting started, because repeating npm/copy here recreates the overlap.
 */
export function HomePasteSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="paste"
      title={homePasteCopy.section.title}
      description={homePasteCopy.section.description}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack id="ai-setup" data-scroll-anchor="" gap={HOME_SECTION_CONTENT_GAP} className="content-offset">
        <Stack id="get-started" data-scroll-anchor="" gap={HOME_SECTION_CONTENT_GAP} data-home-paste="">
          <SetupEntryPrompt id="combined" />
          <Button asChild variant="ghost" size="sm" className="min-h-target w-fit" data-home-full-steps="">
            <HomeLink href={homePasteCopy.fullStepsHref}>
              <DocsActionLabel>{homePasteCopy.fullSteps}</DocsActionLabel>
            </HomeLink>
          </Button>
        </Stack>
      </Stack>
    </Section>
  );
}
