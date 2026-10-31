import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

export function HomeHeroLead() {
  return (
    <Stack
      gap={HOME_SECTION_CONTENT_GAP}
      className="min-w-0 items-start"
      data-home-hero-lead=""
    >
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS} data-home-hero-label="">
          zedkit
        </Text>
        <Heading level={1} className="type-site-h1 max-w-3xl text-balance">
          Build the parts you need. Keep the rest of your app.
        </Heading>
        <Text
          variant="muted"
          className={`max-w-2xl ${HOME_PERSUASION_TEXT_CLASS}`}
          data-home-hero-sub=""
        >
          React components you add to the app you already have.
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center" data-home-hero-actions>
        <Button asChild>
          <Link href="/catalog">Browse components</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="#demo">Try the demo</Link>
        </Button>
      </Stack>
      <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
        MIT · React 19 · Tailwind 4 · npm or source
      </Text>
    </Stack>
  );
}
