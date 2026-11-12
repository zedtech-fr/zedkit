import { Badge, Card, Heading, Section, Stack, Text, cn } from "@zedtech/zedkit-ui";
import { HomeLink } from "@/ui/home/home-link";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SAME_IDEA_CARDS_GRID,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
} from "@/ui/home/home-rhythm";
import { homeSameIdeaCopy } from "@/ui/home/i18n/home-same-idea-copy";

const CARD_IDS = ["ai", "ui", "together"] as const;
type SameIdeaCardId = (typeof CARD_IDS)[number];

const WINDOW_CHIP =
  "rounded-md bg-primary-foreground/20 px-badge-inline py-badge-block font-mono text-caption text-primary-foreground";
const WINDOW_SAVE =
  "rounded-md bg-primary-foreground px-button-pad py-badge-block font-semibold text-caption text-primary";

function SameIdeaWindow({ id }: { id: SameIdeaCardId }) {
  const chips = homeSameIdeaCopy.windows;
  return (
    <Stack
      aria-hidden
      direction="horizontal"
      gap="sm"
      data-home-same-idea-window={id}
      className={cn("pointer-events-none", id === "ui" ? "bg-accent" : "bg-primary")}
    >
      {id === "ai" ? (
        <>
          <Text as="span" className={WINDOW_CHIP}>
            {chips.plan}
          </Text>
          <Text as="span">{chips.arrow}</Text>
          <Text as="span" className={WINDOW_CHIP}>
            {chips.build}
          </Text>
          <Text as="span">{chips.arrow}</Text>
          <Text as="span" className={WINDOW_SAVE}>
            {chips.check}
          </Text>
        </>
      ) : null}
      {id === "ui" ? (
        <>
          <Text as="span" className={WINDOW_SAVE}>
            {chips.save}
          </Text>
          <Stack className="h-control-height-sm min-w-select-content-min rounded-md border border-primary-foreground/60 bg-primary-foreground/30" />
          <Badge className="rounded-full bg-primary-foreground text-primary shadow-none">{chips.active}</Badge>
        </>
      ) : null}
      {id === "together" ? (
        <>
          <Text as="span" className={WINDOW_CHIP}>
            {chips.build}
          </Text>
          <Text as="span">{chips.plus}</Text>
          <Text as="span" className={WINDOW_SAVE}>
            {chips.save}
          </Text>
          <Text as="span">{chips.arrow}</Text>
          <Text as="span" className={WINDOW_SAVE}>
            {chips.check}
          </Text>
        </>
      ) : null}
    </Stack>
  );
}

function sameIdeaBullets(id: SameIdeaCardId, componentCount: number): readonly string[] {
  const { cards, kitCounts } = homeSameIdeaCopy;
  if (id === "ai") {
    return [cards.ai.inventory(kitCounts.skills, kitCounts.agents), cards.ai.rules, cards.ai.tools];
  }
  if (id === "ui") {
    return [cards.ui.components(componentCount), cards.ui.looks, cards.ui.stack];
  }
  return cards.together.bullets;
}

function SameIdeaCard({ id, componentCount }: { id: SameIdeaCardId; componentCount: number }) {
  const card = homeSameIdeaCopy.cards[id];
  return (
    <li data-home-same-idea-column={id}>
      <Card className="flex h-full flex-col overflow-hidden shadow-none">
        <SameIdeaWindow id={id} />
        <Stack gap="lg" className="flex-1 surface-pad-md">
          <Stack gap="tight">
            <Heading level={3} typeRole="heading">
              {card.title}
            </Heading>
            <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
              {card.tagline}
            </Text>
          </Stack>
          <ul className="trim-margin flex list-none flex-col gap-stack-sm flush">
            {sameIdeaBullets(id, componentCount).map((bullet) => (
              <li key={bullet} data-home-same-idea-bullet="">
                <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                  {bullet}
                </Text>
              </li>
            ))}
          </ul>
          <HomeLink
            href={card.href}
            className="mt-auto inline-flex min-h-target w-fit items-center font-medium text-foreground link-offset focus-ring hover:underline"
          >
            {card.link}
          </HomeLink>
        </Stack>
      </Card>
    </li>
  );
}

function SameIdeaLands({ componentCount }: { componentCount: number }) {
  const { kitCounts, lands } = homeSameIdeaCopy;
  const items = [
    { count: kitCounts.skills, label: lands.skills },
    { count: kitCounts.agents, label: lands.agents },
    { count: componentCount, label: lands.components },
    { count: kitCounts.looks, label: lands.looks },
  ];
  return (
    <Stack
      direction="horizontal"
      gap="lg"
      data-home-same-idea-lands=""
      className="flex-wrap justify-between"
    >
      <Text as="span">{lands.heading}</Text>
      <Stack direction="horizontal" gap="lg" className="flex-wrap font-mono text-dense">
        {items.map((item) => (
          <Text as="span" key={item.label}>
            <Text as="span">{item.count}</Text>{" "}
            <Text as="span" variant="muted">
              {item.label}
            </Text>
          </Text>
        ))}
        <Text as="span">{lands.mit}</Text>
      </Stack>
    </Stack>
  );
}

/**
 * Right after the hero: AI, UI and Together as one idea, then what lands.
 *
 * Compose-UI: three equal cards then a slim inverted count bar, because:
 * client = integrating developer who needs the two kits and the combined
 * map as one band. Stack until lg, then three columns, because compose by
 * priority through the tablet step. Violet only in the 120px product
 * windows, because high-value panel accents, not page fill. Count bar
 * inverted zinc, because it is a contrast strip, not a Glass indigo slab.
 * No identity form, because customization lives in the site dock.
 */
export function HomeSameIdeaSection({ componentCount }: { componentCount: number }) {
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
        <ul className={HOME_SAME_IDEA_CARDS_GRID}>
          {CARD_IDS.map((id) => (
            <SameIdeaCard key={id} id={id} componentCount={componentCount} />
          ))}
        </ul>
      </Stack>
      <SameIdeaLands componentCount={componentCount} />
    </Section>
  );
}
