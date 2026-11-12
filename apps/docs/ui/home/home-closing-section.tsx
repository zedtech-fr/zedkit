import { Button, Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { HomeLink } from "@/ui/home/home-link";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeClosingCopy } from "@/ui/home/i18n/home-closing-copy";

/**
 * After manifesto: one ask that sends the visitor back to the paste hashes.
 *
 * Compose-UI: title, subtitle, one Setup action to #ai-setup, because a
 * third copy field repeats the hero. Centered reading measure, because
 * neighbours (manifesto panel, family index) already use wide grids.
 * Site-action, because this is a chrome CTA, not a high-value panel.
 */
export function HomeClosingSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="closing"
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="mx-auto max-w-reading items-center content-offset text-center"
        data-home-closing=""
      >
        <Heading level={2} typeRole="title">
          {homeClosingCopy.section.title}
        </Heading>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {homeClosingCopy.section.description}
        </Text>
        <Button asChild data-site-action="" className="min-h-target w-fit">
          <HomeLink href={homeClosingCopy.actionHref}>{homeClosingCopy.action}</HomeLink>
        </Button>
      </Stack>
    </Section>
  );
}
