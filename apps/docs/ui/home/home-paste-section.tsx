import { Button, Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { HomeLink } from "@/ui/home/home-link";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PASTE_LANDS_GRID,
  HOME_PASTE_TIMELINE_GRID,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homePasteCopy } from "@/ui/home/i18n/home-paste-copy";

const LANDS_IDS = ["ai", "ui"] as const;

function PasteLandsListing() {
  return (
    <ul className={HOME_PASTE_LANDS_GRID} data-home-paste-lands="">
      {LANDS_IDS.map((id) => {
        const column = homePasteCopy.lands[id];
        return (
          <li key={id} className="surface-pad-md">
            <Stack gap="sm">
              <Stack direction="horizontal" gap="sm" className="flex-wrap">
                <Text as="span" typeRole="label">
                  {column.kit}
                </Text>
                <Text as="span" variant="muted" typeRole="caption">
                  {column.when}
                </Text>
              </Stack>
              <ul className="trim-margin flex list-none flex-col flush font-mono text-dense">
                {column.files.map((file) => (
                  <li key={file.path}>
                    <Text as="span" className="font-mono text-dense">
                      {file.path}
                    </Text>
                    {"note" in file ? (
                      <>
                        {" "}
                        <Text as="span" variant="muted" className="font-mono text-dense">
                          {file.note}
                        </Text>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Stack>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Hash landing after the same-idea band. Aliases keep README and hero
 * CTAs landing here (inner stacks take focus on a hash jump).
 * The copyable map prompt lives in the hero.
 *
 * Compose-UI: hashes plus a quiet Getting started link, because two
 * always-visible paste targets compete. Native id is enough for the
 * aliases. Adoption tabs stay on Getting started, because repeating
 * npm/copy here recreates the overlap. Four timeline facts, because
 * "go to lunch" needs a duration without a second copy field. Dark
 * zinc band plus a two-column file listing, because neighbours must
 * differ in shape and the mockup paste surface was not a #73 drop.
 */
export function HomePasteSection() {
  return (
    <Section
      bleed
      spacing="md"
      containerWidth="wide"
      id="paste"
      title={homePasteCopy.section.title}
      description={homePasteCopy.section.description}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
      data-home-paste=""
    >
      <Stack id="ai-setup" tabIndex={-1} data-scroll-anchor="" gap={HOME_SECTION_CONTENT_GAP} className="content-offset">
        <Stack id="get-started" tabIndex={-1} data-scroll-anchor="" gap={HOME_SECTION_CONTENT_GAP}>
          <ul className={HOME_PASTE_TIMELINE_GRID}>
            {homePasteCopy.timeline.map((item) => (
              <li key={item.label} className="border-t content-offset">
                <Stack gap="tight">
                  <Heading level={3} typeRole="heading">
                    {item.label}
                  </Heading>
                  <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                    {item.body}
                  </Text>
                </Stack>
              </li>
            ))}
          </ul>
          <PasteLandsListing />
          <Button asChild variant="ghost" size="sm" className="min-h-target w-fit" data-home-full-steps="">
            <HomeLink href={homePasteCopy.fullStepsHref}>
              <DocsActionLabel>{homePasteCopy.fullSteps}</DocsActionLabel>
            </HomeLink>
          </Button>
        </Stack>
      </Stack>
    </Section>
  );
}
