import { Heading, Stack, Surface, Text, ThemeScope } from "@zedtech/zedkit-ui";

import { foundationsCopy as copy } from "../i18n/foundations-copy";

/**
 * Métier: public TypeScript kit; this site is the reading surface for the packages.
 * Client personas: integrating developers who own a consuming app and need the site frame rules in one place.
 * Customers: those same developers (the docs site is the product surface).
 * Customer personas: first visit or restyle pass at 390, 809, and 1440, including dark mode; hurried; need the first screen to say what the site gives them in the theme they are actually using.
 * UI decisions: hero band + glass-on-panel follow html.dark through --zk-site-* reading tokens, Color / Type stay below as proof, because customer = developer judging the live site frame, not a frozen light mockup.
 *   Title overlay 40px on this hero only, because the display specimen below stays 48px. No second chrome theme control, because the site already has a theme.
 *   Glass indigo/violet chips stay a Glass ThemeScope without a pinned mode, because copy says those hues are Glass tokens, not page fill.
 * #73-thread vs mockup: panel fill is flat bg-primary, not a 135-degree gradient with halos.
 */
export function FoundationsHero() {
  return (
    <Stack
      gap="lg"
      data-foundations-hero=""
      className={
        // not-prose is a fumadocs escape hatch, not a Tailwind utility.
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        "not-prose"
      }
    >
      <Stack gap="lg" data-foundations-hero-grid="" className="content-shrink">
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
    </Stack>
  );
}
