import Link from "next/link";
import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { docsSite } from "@/lib/site";
import { HomeHeroDashboard } from "@/ui/home/home-hero-dashboard";
import { HomeUiQuickstartSection } from "@/ui/home/home-ui-quickstart-section";
import { KitVersionLabel } from "@/ui/kit-version-label";

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
    <Stack gap={6} className="items-start">
      <Stack gap={3} className="items-start">
        <Stack direction="horizontal" gap={3} className="flex-wrap items-center">
          <Text variant="muted" className="text-sm font-medium tracking-wide uppercase">zedkit</Text>
          <KitVersionLabel version={version} changelogHref={changelogHref} />
        </Stack>
        <Heading level={1} className="max-w-3xl text-3xl text-balance md:text-4xl">
          Build the parts you need. Keep the rest of your app.
        </Heading>
        <Text className="max-w-2xl text-lg">
          TypeScript packages for admin UI, backend helpers, SEO, and coding-agent setup — each
          need documented from the same catalog as the site, with{" "}
          <Link href="/docs/maturity-and-compatibility">linked maturity badges</Link> on every page.
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button asChild>
          <Link href="#entry-points">Explore examples</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs">Open documentation</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="#components">Browse components</Link>
        </Button>
      </Stack>
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
