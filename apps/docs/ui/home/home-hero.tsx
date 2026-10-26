import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { docsSite } from "@/lib/site";
import { HomeAiSetupSection } from "@/ui/home/home-ai-setup-section";
import { HomeInstallOrCopySection } from "@/ui/home/home-install-or-copy-section";
import { HomeHeroDashboard } from "@/ui/home/home-hero-dashboard";
import { HomeUiQuickstartSection } from "@/ui/home/home-ui-quickstart-section";
import { KitVersionLabel } from "@/ui/kit-version-label";
import { HOME_CARD_CONTENT_GAP, HOME_SECTION_CONTENT_GAP } from "@/ui/home/home-rhythm";

export function HomeHero({
  featuredPackage,
  version,
  changelogHref,
}: {
  featuredPackage: string;
  version: string;
  changelogHref: string;
}) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="min-w-0 items-start">
      <Stack gap={HOME_CARD_CONTENT_GAP} className="items-start">
        <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
          <Text variant="muted">zedkit</Text>
          <KitVersionLabel version={version} changelogHref={changelogHref} />
        </Stack>
        <Heading level={1} className="max-w-3xl text-balance">
          Build the parts you need. Keep the rest of your app.
        </Heading>
        <Text className="max-w-2xl">
          TypeScript packages for admin UI, backend helpers, SEO, and coding-agent setup — each
          need documented from the same catalog as the site, with{" "}
          <Link href="/docs/maturity-and-compatibility">linked maturity badges</Link> on every page.
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button asChild>
          <Link href="#ai-setup">Set up your AI agent</Link>
        </Button>
        <Button asChild>
          <Link href="#quickstart">UI quickstart</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs">Open documentation</Link>
        </Button>
      </Stack>
      <HomeAiSetupSection />
      <HomeInstallOrCopySection npmPackage={featuredPackage} />
      <HomeUiQuickstartSection
        npmPackage={featuredPackage}
        siteUrl={docsSite.url}
        featuredBrick={featuredRegistryBrick}
        registryBricks={registryBrickNames}
      />
      <HomeHeroDashboard />
    </Stack>
  );
}
