import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeManifestoCopy } from "@/ui/home/i18n/home-manifesto-copy";

/**
 * After limits: the lock-in quote on an inner high-value panel.
 *
 * Compose-UI: inner panel, not indigo page fill, because: visual contract
 * keeps the page a neutral reading surface and puts violet on a high-value
 * panel. Quote as H2, attribution as body, because the quote is the band
 * title. No manifesto link, because the dest is not verified in-repo.
 * Inner reading measure, because a full-wide quote fights the limits grid above.
 */
export function HomeManifestoSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="manifesto"
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack
        gap={HOME_SECTION_CONTENT_GAP}
        className="mx-auto max-w-reading items-center content-offset text-center"
        data-home-manifesto-panel=""
      >
        <Heading level={2} typeRole="title">
          {homeManifestoCopy.quote}
        </Heading>
        <Text className={HOME_PERSUASION_TEXT_CLASS}>{homeManifestoCopy.attribution}</Text>
      </Stack>
    </Section>
  );
}
