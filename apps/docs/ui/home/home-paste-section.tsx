import { Button, Section, Stack } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HomeLink } from "@/ui/home/home-link";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homePasteCopy } from "@/ui/home/i18n/home-paste-copy";

/**
 * Hash landing after the same-idea band. Aliases keep README and hero
 * CTAs landing here (inner stacks take focus on a hash jump).
 * The copyable map prompt lives in the hero.
 *
 * Compose-UI: hashes plus a quiet Getting started link, because two
 * always-visible paste targets compete. Native id is enough for the
 * aliases. Adoption tabs stay on Getting started, because repeating
 * npm/copy here recreates the overlap.
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
      <Stack id="ai-setup" tabIndex={-1} data-scroll-anchor="" gap={HOME_SECTION_CONTENT_GAP} className="content-offset">
        <Stack id="get-started" tabIndex={-1} data-scroll-anchor="" gap={HOME_SECTION_CONTENT_GAP} data-home-paste="">
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
