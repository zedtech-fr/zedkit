import { Heading, Stack, Surface, Text, ThemeScope } from "@zedtech/zedkit-ui";

import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";

/**
 * Métier: public TypeScript kit; this site is the reading surface for the packages.
 * Client personas: integrating developers who own a consuming app and need the site frame rules in one place.
 * Customers: those same developers (the docs site is the product surface).
 * Customer personas: first visit or restyle pass at 1440 and 390; hurried; want the target look on the first screen.
 * UI decisions: site-style display title, because customer = developer judging the site frame.
 *   Hero is title + intro | glass callout (stacked below md), because one focal point per band.
 * #73-thread vs mockup: panel fill is flat bg-primary, not a 135-degree gradient with halos.
 */
export function FoundationsHero() {
  return (
    <Stack
      gap="lg"
      className={
        // not-prose is a fumadocs escape hatch, not a Tailwind utility.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        "not-prose grid content-shrink md:grid-pair md:items-start"
      }
    >
      <Stack gap="sm">
        <Heading level={1} typeRole="display" className="text-balance">
          {copy.hero.title}
        </Heading>
        <Text typeRole="lead" variant="muted">
          {copy.hero.intro}
        </Text>
      </Stack>
      <ThemeScope identity="glass">
        <Stack className="rounded-xl bg-primary p-card-padding">
          <Surface variant="glass" elevation={0} padding="card" radius="lg">
            <Stack gap="sm" className="text-center">
              <Text typeRole="label">{copy.swatches.panelTitle}</Text>
              <Text typeRole="small" variant="muted">
                {copy.swatches.panelBody}
              </Text>
            </Stack>
          </Surface>
        </Stack>
      </ThemeScope>
    </Stack>
  );
}
