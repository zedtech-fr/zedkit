import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_LIMITS_GRID,
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_READING_REVEAL_PROPS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";
import { homeLimitsCopy } from "@/ui/home/i18n/home-limits-copy";

/**
 * After looks: what the kit does not do, before the manifesto.
 *
 * Compose-UI: three short columns from lg, stacked on a phone, because:
 * client = integrating developer who needs limits before adopting, and a
 * feature-card grid would look like a sell. Section H2, item H3,
 * persuasion body. Muted band, because neighbours (looks stage, manifesto
 * band) already occupy the high-value surfaces.
 */
export function HomeLimitsSection() {
  return (
    <Section
      bleed
      tone="muted"
      spacing="md"
      containerWidth="wide"
      id="limits"
      snap="none"
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="content-offset"
        data-home-limits=""
        {...HOME_READING_REVEAL_PROPS}
      >
        <Stack gap="tight" className="lg:flex-row lg:items-baseline lg:justify-between">
          <Heading level={2} typeRole="title">
            {homeLimitsCopy.section.title}
          </Heading>
          <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
            {homeLimitsCopy.section.description}
          </Text>
        </Stack>
        <ul className={HOME_LIMITS_GRID}>
          {homeLimitsCopy.items.map((item) => (
            <li key={item.title} className="border-t content-offset">
              <Stack gap="tight">
                <Heading level={3} typeRole="heading">
                  {item.title}
                </Heading>
                <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                  {item.body}
                </Text>
              </Stack>
            </li>
          ))}
        </ul>
      </Stack>
    </Section>
  );
}
