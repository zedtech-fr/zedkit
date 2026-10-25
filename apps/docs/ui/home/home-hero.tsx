import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { demoRegistry } from "@/components/demos/registry";
import { HomeInstallCommands } from "@/ui/home/home-install-commands";

export function HomeHero({ featuredPackage }: { featuredPackage: string }) {
  const { Demo: ButtonDemoLive } = demoRegistry.ButtonDemo;
  return (
    <Stack gap={6} className="items-start">
      <Stack gap={3} className="items-start">
        <Heading level={1}>zedkit</Heading>
        <Text className="max-w-2xl text-lg">
          Open-source TypeScript packages and an admin UI kit. Doc pages, maturity badges, and
          install commands are generated from the catalog so they stay aligned with the code.
        </Text>
      </Stack>
      <Stack gap={4} className="w-full max-w-2xl">
        <Heading level={2} className="text-base font-semibold">
          Install
        </Heading>
        <HomeInstallCommands npmPackage={featuredPackage} />
      </Stack>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Button variants (live)</CardTitle>
        </CardHeader>
        <CardContent>
          <ButtonDemoLive />
        </CardContent>
      </Card>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Link href="/docs">
          <Button>Read the docs</Button>
        </Link>
        <Link href="#scenarios">
          <Button variant="outline">Pick a scenario</Button>
        </Link>
        <Link href="#components">
          <Button variant="outline">Browse components</Button>
        </Link>
      </Stack>
    </Stack>
  );
}
