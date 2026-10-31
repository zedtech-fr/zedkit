import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { HOME_CARD_CONTENT_GAP, HOME_LEAD_TEXT_CLASS, HOME_METADATA_TEXT_CLASS, HOME_SECTION_CONTENT_GAP, HOME_SMALL_TEXT_CLASS } from "@/ui/home/home-rhythm";

export function HomeHeroLead({
  version,
  releasesHref,
  latestChange,
}: {
  version: string;
  releasesHref: string;
  latestChange: string;
}) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0 items-start">
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
        <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
          <Text variant="muted" className={HOME_METADATA_TEXT_CLASS}>zedkit</Text>
          <KitVersionLabel version={version} releasesHref={releasesHref} />
        </Stack>
        <Heading level={1} className="max-w-3xl text-balance">
          Build the parts you need. Keep the rest of your app.
        </Heading>
        <Text variant="muted" className={`max-w-2xl ${HOME_LEAD_TEXT_CLASS}`}>
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
      <Stack gap={1} className="max-w-2xl">
        <Text variant="muted" className={HOME_SMALL_TEXT_CLASS}>
          MIT · React 19 · Tailwind 4 · npm or source
        </Text>
        <Text variant="muted" className={HOME_SMALL_TEXT_CLASS}>
          Latest in v{version}: {latestChange}
        </Text>
      </Stack>
    </Stack>
  );
}
