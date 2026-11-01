import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";
import { HomeHeroLeadActions } from "@/ui/home/home-hero-lead-actions";

export function HomeHeroLead({ className }: { className?: string }) {
  return (
    <Stack
      gap={8}
      className={`min-w-0 items-start ${className ?? ""}`}
      data-home-hero-lead=""
    >
      <Stack gap={3} className="items-start">
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS} data-home-hero-label="">
          {homeCopy.hero.label}
        </Text>
        <Heading level={1} className="type-site-h1 max-w-lg text-balance">
          {homeCopy.hero.title}
        </Heading>
      </Stack>
      <Text
        variant="muted"
        className={`max-w-md ${HOME_PERSUASION_TEXT_CLASS}`}
        data-home-hero-sub=""
      >
        {homeCopy.hero.sub}
      </Text>
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
        <HomeHeroLeadActions />
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
          {homeCopy.hero.facts}
        </Text>
      </Stack>
    </Stack>
  );
}
