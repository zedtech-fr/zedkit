import { Section, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SAME_IDEA_GRID,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeSixSentencesCopy } from "@/ui/home/i18n/home-six-sentences-copy";

/**
 * Facts between same-idea and paste: six sentences already on the site.
 *
 * Compose-UI: stacked sentences in the same two-column-from-lg rhythm as
 * same-idea, no cards, because: client = integrating developer who needs
 * facts before another command, and a glass-card grid is the template tell.
 * Section H2 only (no description), because neighbours must differ in shape.
 * No paste fields, because the next band is the paste.
 */
export function HomeSixSentencesSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="six-sentences"
      title={homeSixSentencesCopy.section.title}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="content-offset" data-home-six-sentences="">
        <ul className={HOME_SAME_IDEA_GRID}>
          {homeSixSentencesCopy.sentences.map((sentence) => (
            <li key={sentence}>
              <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                {sentence}
              </Text>
            </li>
          ))}
        </ul>
      </Stack>
    </Section>
  );
}
