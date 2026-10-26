import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { demoRegistry } from "@/components/demos/registry";
import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { docsSite } from "@/lib/site";
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
  const { Demo: ButtonDemoLive } = demoRegistry.ButtonDemo;
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Button variants (live)</CardTitle>
        </CardHeader>
        <CardContent>
          <ButtonDemoLive />
        </CardContent>
      </Card>
    </Stack>
  );
}
