import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { demoRegistry } from "@/components/demos/registry";
import { featuredRegistryBrick, registryBrickNames } from "@/content/registry-site";
import { docsSite } from "@/lib/site";
import { HomeInstallCommands } from "@/ui/home/home-install-commands";
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
        <Heading level={1} className="max-w-3xl text-balance">
          Build the parts you need. Keep the rest of your app.
        </Heading>
        <Text className="max-w-2xl text-lg">
          TypeScript packages for admin UI, backend helpers, SEO, and coding-agent setup — each
          need documented from the same catalog as the site.
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
      <Stack gap={4} className="w-full max-w-2xl">
        <Heading level={2} className="text-base font-semibold">
          Install
        </Heading>
        <HomeInstallCommands
          npmPackage={featuredPackage}
          siteUrl={docsSite.url}
          featuredBrick={featuredRegistryBrick}
          registryBricks={registryBrickNames}
        />
      </Stack>
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
