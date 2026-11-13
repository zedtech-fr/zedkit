import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { MAP_AI_UI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { HomeCopyCommandField } from "@/ui/home/home-copy-command-field";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_READING_REVEAL_PROPS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";
import { homeClosingCopy } from "../i18n/home-closing-copy";

/**
 * After manifesto: one ask that copies the same AI-and-UI map prompt as the hero.
 *
 * Compose-UI: shared wrapping copy-command field with the AI-and-UI prompt, because:
 * the last ask is copy-and-go and must match the hero field; the kit shown-once
 * secret is the wrong chrome for this site action.
 * Centered reading measure, because: mockup centers both bands; a full-wide
 * prompt fights the limits grid. The field wraps `text-left` so the centered
 * stack does not inherit into the prompt box.
 */
export function HomeClosingSection() {
  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="wide"
      id="closing"
      aria-labelledby="closing-heading"
      snap="none"
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="mx-auto w-full max-w-reading items-center content-offset text-center"
        data-home-closing=""
        {...HOME_READING_REVEAL_PROPS}
      >
        <Heading id="closing-heading" level={2} typeRole="title">
          {homeClosingCopy.section.title}
        </Heading>
        <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
          {homeClosingCopy.section.description}
        </Text>
        <div className="w-full text-left">
          <HomeCopyCommandField
            value={MAP_AI_UI_SETUP_MINI_PROMPT}
            aria-label={homeClosingCopy.promptAriaLabel}
            copyLabel={homeClosingCopy.promptCopyLabel}
          />
        </div>
      </Stack>
    </Section>
  );
}
