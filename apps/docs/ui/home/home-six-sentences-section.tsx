import { Badge, Heading, Section, Stack, Surface, Text } from "@zedtech/zedkit-ui";
import {
  HOME_MARKETING_ROOT_PROPS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
  HOME_SECTION_REVEAL_PROPS,
  HOME_SIX_SENTENCES_GRID,
} from "@/ui/home/home-rhythm";
import { homeSixSentencesCopy } from "@/ui/home/i18n/home-six-sentences-copy";

type SixSentencesCard = (typeof homeSixSentencesCopy.cards)[number];

function isFeaturedCard(id: SixSentencesCard["id"]) {
  return id === "quality" || id === "consistency";
}

/**
 * Quote/reply cards between same-idea and paste: six agent sentences, then
 * the kit's answer.
 *
 * Compose-UI: quote then reply on six cards, because: client = developer
 * who recognises the sentence then wants the kit's answer. Two featured
 * primary panels among four flat white cards, because neighbours must
 * differ in shape and the mockup's violet/white treatment was not a #73
 * drop. Stack on a phone, `lg:grid-quad` with featured `span-rest`, because
 * compose by priority. Tokens not hex, because other looks and dark mode
 * still have to read.
 */
export function HomeSixSentencesSection() {
  return (
    <Section
      bleed
      tone="muted"
      spacing="md"
      containerWidth="wide"
      id="six-sentences"
      title={homeSixSentencesCopy.section.title}
      description={homeSixSentencesCopy.section.description}
      snap="none"
      {...HOME_SECTION_REVEAL_PROPS}
      {...HOME_MARKETING_ROOT_PROPS}
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="content-offset" data-home-six-sentences="">
        <ul className={HOME_SIX_SENTENCES_GRID}>
          {homeSixSentencesCopy.cards.map((card) => (
            <SixSentencesCardItem key={card.id} card={card} />
          ))}
        </ul>
      </Stack>
    </Section>
  );
}

function SixSentencesCardItem({ card }: { card: SixSentencesCard }) {
  const featured = isFeaturedCard(card.id);
  const replyBody = (
    <>
      <Heading level={3} typeRole="heading">
        {card.replyTitle}
      </Heading>
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {card.replyBody}
      </Text>
    </>
  );
  return (
    <li className={featured ? "lg:span-rest" : undefined}>
      <Surface
        elevation={0}
        radius="xl"
        padding="card"
        data-home-six-sentences-card={featured ? "featured" : "plain"}
        className="h-full"
      >
        <Stack gap="lg" className="h-full justify-between">
          <Stack gap="sm">
            <Stack direction="horizontal" gap="sm">
              <Badge data-home-six-sentences-kit={card.kit}>{homeSixSentencesCopy.kit[card.kit]}</Badge>
              <Text as="span" variant="muted" typeRole="label">
                {card.label}
              </Text>
            </Stack>
            <blockquote data-home-six-sentences-quote="">
              <Heading as="div" typeRole={featured ? "title" : "heading"}>
                {card.quote}
              </Heading>
            </blockquote>
            <Text variant="muted">{card.quoteAside}</Text>
          </Stack>
          {featured ? (
            <Surface variant="glass" elevation={0} radius="xl" padding="md" data-home-six-sentences-reply="">
              <Stack gap="tight">{replyBody}</Stack>
            </Surface>
          ) : (
            <Stack gap="tight" data-home-six-sentences-reply="">
              {replyBody}
            </Stack>
          )}
        </Stack>
      </Surface>
    </li>
  );
}
