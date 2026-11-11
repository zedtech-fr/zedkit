import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SAME_IDEA_GRID,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeSameIdeaCopy } from "@/ui/home/i18n/home-same-idea-copy";

const COLUMN_IDS = ["ui", "ai"] as const;

/**
 * Right after the hero: UI and AI as one idea, before the facts and the paste.
 *
 * Compose-UI: two short columns, no paste fields, because: client =
 * integrating developer who just saw a hero paste and needs the joint idea,
 * not more copy buttons. Nest stays in paste copy, not a third column.
 * Section H2, column H3, persuasion body, because one marketing H1 already
 * sits in the hero. Mobile stacks, lg two columns, because compose by
 * priority, not a squeezed desktop row. No glass slab, because violet stays
 * in high-value panels and the hero window already has Glass material.
 */
export function HomeSameIdeaSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="same-idea"
      title={homeSameIdeaCopy.section.title}
      description={homeSameIdeaCopy.section.description}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="content-offset" data-home-same-idea="">
        <ul className={HOME_SAME_IDEA_GRID}>
          {COLUMN_IDS.map((id) => (
            <li key={id} data-home-same-idea-column={id}>
              <Stack gap="tight">
                <Heading level={3} typeRole="heading">
                  {homeSameIdeaCopy.columns[id].title}
                </Heading>
                <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                  {homeSameIdeaCopy.columns[id].body}
                </Text>
              </Stack>
            </li>
          ))}
        </ul>
      </Stack>
    </Section>
  );
}
