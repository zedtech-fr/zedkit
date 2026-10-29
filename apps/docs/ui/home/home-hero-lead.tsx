import dynamic from "next/dynamic";
import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { HOME_CARD_CONTENT_GAP, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

const HomeHeroPreview = dynamic(
  () => import("@/ui/home/home-hero-preview").then((mod) => ({ default: mod.HomeHeroPreview })),
  {
    loading: () => (
      <Stack
        aria-hidden="true"
        className="pointer-events-none min-h-72 w-full lg:min-h-80"
        data-home-hero-preview
      />
    ),
  },
);

/** Above-the-fold hero copy and CTAs only — kept out of the deferred chunk (#618). */
export function HomeHeroLead({
  version,
  changelogHref,
}: {
  version: string;
  changelogHref: string;
}) {
  return (
    <Stack
      gap={HOME_SECTION_CONTENT_GAP}
      className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-2 lg:items-center"
    >
      <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0 items-start">
        <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
          <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
            <Text variant="muted" className="text-xs">
              zedkit
            </Text>
            <KitVersionLabel version={version} changelogHref={changelogHref} />
          </Stack>
          <Heading level={1} className="max-w-3xl text-balance">
            Build the parts you need. Keep the rest of your app.
          </Heading>
          <Text variant="muted" className="max-w-2xl">
            TypeScript packages for UI, core & server helpers, SEO, and coding-agent setup — each need
            documented from the same catalog as the site, with{" "}
            <Link href="/docs/maturity-and-compatibility">linked maturity badges</Link> on every page.
          </Text>
        </Stack>
        <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
          <Button asChild>
            <Link href="#ai-setup">Set up your AI agent</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="#install-or-copy">Install or copy</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="#quickstart">UI quickstart</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href="/docs">
              <DocsActionLabel>Open documentation</DocsActionLabel>
            </Link>
          </Button>
        </Stack>
      </Stack>
      <HomeHeroPreview />
    </Stack>
  );
}
