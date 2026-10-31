import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
<<<<<<< HEAD
import {
  HOME_CARD_CONTENT_GAP,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";
=======
import { KitVersionLabel } from "@/ui/kit-version-label";
import { HOME_CARD_CONTENT_GAP, HOME_METADATA_TEXT_CLASS, HOME_PERSUASION_TEXT_CLASS, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";
>>>>>>> origin/feat/home-hero-demo-detail-l1c

export function HomeHeroLead() {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0 items-start">
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
<<<<<<< HEAD
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
          zedkit
        </Text>
=======
        <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>zedkit</Text>
          <KitVersionLabel version={version} releasesHref={releasesHref} />
        </Stack>
>>>>>>> origin/feat/home-hero-demo-detail-l1c
        <Heading level={1} className="max-w-3xl text-balance">
          Build the parts you need. Keep the rest of your app.
        </Heading>
        <Text variant="muted" className={`max-w-2xl ${HOME_PERSUASION_TEXT_CLASS}`}>
          An interface made of ready parts, for the app you already have.
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center" data-home-hero-actions>
        <Button asChild>
          <Link href="#demo">Explore the demo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="#quickstart">Start building</Link>
        </Button>
      </Stack>
<<<<<<< HEAD
      <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
        MIT · React 19 · Tailwind 4 · npm or source
      </Text>
=======
      <Stack gap={1} className="max-w-2xl">
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
          MIT · React 19 · Tailwind 4 · npm or source
        </Text>
        <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>
          Latest in v{version}: {latestChange}
        </Text>
      </Stack>
>>>>>>> origin/feat/home-hero-demo-detail-l1c
    </Stack>
  );
}
