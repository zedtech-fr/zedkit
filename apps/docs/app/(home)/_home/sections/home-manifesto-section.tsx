import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_READING_REVEAL_PROPS,
  HOME_SECTION_CONTENT_GAP,
} from "../home-rhythm";
import { homeManifestoCopy } from "../i18n/home-manifesto-copy";

/**
 * After limits: the lock-in quote on a full-bleed high-value band.
 *
 * Compose-UI: full-bleed origin band, because: client = developer who
 * just read limits; neighbours (muted limits grid, light closing) must
 * differ in shape; the inset card was the 12 Nov defect.
 * Tokenized `--primary`→`--accent` 135° fill plus static circle/stripe,
 * because: this is a high-value Glass band (not page fill); neighbours
 * (muted limits grid, light closing) must differ in shape; #246 asks for
 * kit tokens rather than mockup hex.
 * Sr-only Origin H2 + blockquote, because: the rotor needs a short
 * section name; the quote must not occupy the heading list.
 * Golden-rule line under the quote, because: that is the practitioner
 * principle; the origin paragraph explains why the kit is public.
 * Centered reading measure, because: mockup centers both bands; a full-wide
 * quote fights the limits grid.
 * No off-path company link, because: the band is the quote and the
 * principle, not a manifesto CTA.
 */
export function HomeManifestoSection() {
  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="wide"
      id="manifesto"
      aria-labelledby="manifesto-heading"
      data-allow-clip=""
      snap="none"
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="mx-auto max-w-reading items-center content-offset text-center"
        data-home-manifesto=""
        {...HOME_READING_REVEAL_PROPS}
      >
        <Heading id="manifesto-heading" level={2} className="sr-only">
          {homeManifestoCopy.sectionLabel}
        </Heading>
        <blockquote className="trim-margin not-italic" aria-describedby="manifesto-attribution">
          <Heading as="div" typeRole="title">
            {homeManifestoCopy.quote}
          </Heading>
        </blockquote>
        <Text className={HOME_PERSUASION_TEXT_CLASS}>{homeManifestoCopy.goldenRule}</Text>
        <Text id="manifesto-attribution" className={HOME_PERSUASION_TEXT_CLASS}>
          {homeManifestoCopy.attribution}
        </Text>
      </Stack>
    </Section>
  );
}
