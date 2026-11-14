import { Badge, Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { MAP_AI_UI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { HomeCopyCommandField } from "../home-copy-command-field";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PASTE_LANDS_GRID,
  HOME_PASTE_TIMELINE_GRID,
  HOME_PASTE_TIMELINE_REVEAL_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
} from "../home-rhythm";
import { homePasteCopy } from "../i18n/home-paste-copy";
import { homeSameIdeaCopy } from "../i18n/home-same-idea-copy";

const LANDS_IDS = Object.keys(homePasteCopy.lands) as Array<keyof typeof homePasteCopy.lands>;

const PASTE_KIT_BADGE = {
  ai: "border-transparent bg-primary-foreground text-primary shadow-none hover:bg-primary-foreground",
  ui: "border-transparent bg-primary-foreground text-accent-foreground shadow-none hover:bg-primary-foreground",
} as const;

function pasteFileNote(
  id: (typeof LANDS_IDS)[number],
  file: (typeof homePasteCopy.lands)[(typeof LANDS_IDS)[number]]["files"][number],
) {
  if (id === "ai" && file.path === ".agents/skills/") {
    return homePasteCopy.skillsAgents(
      homeSameIdeaCopy.kitCounts.skills,
      homeSameIdeaCopy.kitCounts.agents,
    );
  }
  return "note" in file ? file.note : undefined;
}

function PasteLandsListing() {
  return (
    <ul className={HOME_PASTE_LANDS_GRID} data-home-paste-lands="">
      {LANDS_IDS.map((id) => {
        const column = homePasteCopy.lands[id];
        return (
          <li key={id} className="surface-pad-lg">
            <Stack gap="sm">
              <Stack direction="horizontal" gap="sm" className="flex-wrap">
                <Badge className={PASTE_KIT_BADGE[id]}>{column.kit}</Badge>
                <Text as="span" variant="muted" typeRole="caption">
                  {column.when}
                </Text>
              </Stack>
              <ul className="trim-margin flex list-none flex-col flush font-mono text-dense">
                {column.files.map((file) => {
                  const note = pasteFileNote(id, file);
                  const accent = "accent" in file && file.accent;
                  return (
                    <li key={file.path}>
                      <Text as="span" className="font-mono text-dense">
                        {file.path}
                      </Text>
                      {note ? (
                        <>
                          {" "}
                          <Text
                            as="span"
                            variant={accent ? undefined : "muted"}
                            className="font-mono"
                          >
                            {note}
                          </Text>
                        </>
                      ) : null}
                    </li>
                  );
                })}
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
 *
 * Compose-UI:
 * Métier: zedkit publishes npm packages and a docs site, not a hosted app.
 * Client personas: integrating developers who already have an agent; they
 * want one paste, then honest limits, on a laptop or a phone.
 * Customers: the developer's own users — this page does not sell to them.
 * Customer personas: n/a on the docs home. Assumed from `.agents/product.md`:
 * rushed on 390 or 1440, copy without scrolling away from this band.
 * UI decisions:
 *   no extra listing heading, Nest footnote, or install control, because:
 *   the mockup has none of them and same-idea already owns what lands in
 *   the repo.
 *   one bordered two-column well, AI then UI, because: neighbours must
 *   differ in shape and the ticket names that card.
 *   kit Badge chips (light fill, inverted site-action ink), because:
 *   a reader who switched look or dark mode still has to read AI|UI.
 *   highlighted file note uses inverted foreground, because: paired
 *   tokens beat a Glass-only accent hex on zinc.
 *   live skill/agent counts from same-idea kitCounts, because: the ticket
 *   says live counts and that constant is already the home inventory.
 *   named spacing (lg, blocks, surface-pad-lg), because: page-specific
 *   pixel padding is a shell patch.
 *   hashes stay, because: README and hero jumps must not strand the
 *   visitor.
 *   reuse HomeCopyCommandField with the generated map prompt, because:
 *   this band's job is paste one line; the kit shown-once secret and
 *   send/cancel prompt are the wrong chrome.
 *   field first in #get-started, because: a hash jump must copy before
 *   reading the four steps.
 *   light well on zinc (site-action-foreground fill, site-action ink),
 *   because: kit badges already sit that way and an unpinned well matches
 *   the Copy fill.
 *   names distinct from hero and closing, because: three Copy controls
 *   share a page (WCAG 2.5.3; Playwright substring matching).
 */
export function HomePasteSection() {
  return (
    <Section
      bleed
      spacing="lg"
      containerWidth="wide"
      id="paste"
      title={homePasteCopy.section.title}
      description={homePasteCopy.section.description}
      snap="none"
      {...HOME_MARKETING_ROOT_PROPS}
      data-home-paste=""
    >
      <Stack id="ai-setup" tabIndex={-1} data-scroll-anchor="" gap="blocks" className="content-offset">
        <Stack id="get-started" tabIndex={-1} data-scroll-anchor="" gap="blocks">
          <Stack className="w-full" data-home-paste-prompt="">
            <HomeCopyCommandField
              value={MAP_AI_UI_SETUP_MINI_PROMPT}
              aria-label={homePasteCopy.promptAriaLabel}
              copyLabel={homePasteCopy.promptCopyLabel}
            />
          </Stack>
          <ul className={HOME_PASTE_TIMELINE_GRID} {...HOME_PASTE_TIMELINE_REVEAL_PROPS}>
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
        </Stack>
      </Stack>
    </Section>
  );
}
