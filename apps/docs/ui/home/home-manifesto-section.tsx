import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { SITE_COMPANY_URL } from "@/lib/site-links.mjs";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeManifestoCopy } from "@/ui/home/i18n/home-manifesto-copy";
import { OffPathLink } from "@/ui/off-path-link";

/**
 * After limits: the lock-in quote on a full-bleed high-value band.
 *
 * Compose-UI: full-bleed manifesto band, because: client = developer who
 * just read limits; neighbours (muted limits grid, light closing) must
 * differ in shape; the inset card was the 12 Nov defect.
 * Token `--primary` fill, because: #73 forbids decorative gradients except
 * Glass material and forbids indigo/violet as page fill.
 * Sr-only Manifesto H2 + blockquote, because: the rotor needs a short
 * section name; the quote must not occupy the heading list.
 * Centered reading measure, because: mockup centers both bands; a full-wide
 * quote fights the limits grid.
 */
export function HomeManifestoSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="manifesto"
      aria-labelledby="manifesto-heading"
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="mx-auto max-w-reading items-center content-offset text-center"
        data-home-manifesto=""
      >
        <Heading id="manifesto-heading" level={2} className="sr-only">
          {homeManifestoCopy.sectionLabel}
        </Heading>
        <blockquote className="trim-margin not-italic" aria-describedby="manifesto-attribution">
          <Heading as="div" typeRole="title">
            {homeManifestoCopy.quote}
          </Heading>
        </blockquote>
        <Text id="manifesto-attribution" className={HOME_PERSUASION_TEXT_CLASS}>
          {homeManifestoCopy.attribution}
        </Text>
        <OffPathLink
          href={SITE_COMPANY_URL}
          className="min-h-target text-foreground underline link-offset focus-ring"
        >
          {homeManifestoCopy.readLink}
        </OffPathLink>
      </Stack>
    </Section>
  );
}
