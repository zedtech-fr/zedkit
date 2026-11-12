import { Heading, Section, SecretField, Stack, Text } from "@zedtech/zedkit-ui";
import { MAP_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeClosingCopy } from "@/ui/home/i18n/home-closing-copy";

/**
 * After manifesto: one ask that copies the same map setup prompt as the hero.
 *
 * Compose-UI: closing SecretField with the map prompt, because: the last
 * ask is copy-and-go; the kit already copies and announces; a second labelled
 * Copy widget would be a parallel control.
 * Centered reading measure, because: mockup centers both bands; a full-wide
 * prompt fights the limits grid. The field wraps `text-left` so the centered
 * stack does not inherit into the prompt box.
 */
export function HomeClosingSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="closing"
      aria-labelledby="closing-heading"
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="mx-auto w-full max-w-reading items-center content-offset text-center"
        data-home-closing=""
      >
        <Heading id="closing-heading" level={2} typeRole="title">
          {homeClosingCopy.section.title}
        </Heading>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {homeClosingCopy.section.description}
        </Text>
        <div className="w-full text-left">
          <SecretField
            multiline
            value={MAP_SETUP_MINI_PROMPT}
            aria-label={homeClosingCopy.promptAriaLabel}
            copyLabel={homeClosingCopy.promptCopyLabel}
          />
        </div>
      </Stack>
    </Section>
  );
}
