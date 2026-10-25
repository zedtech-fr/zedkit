"use client";

import { Heading, SecretField, Stack, Text } from "@zedtech/zedkit-ui";

import { HomeInstallCommands } from "@/ui/home/home-install-commands";

export function HomeUiQuickstartCopy({
  globalsCss,
  pageTsx,
  npmPackage,
  siteUrl,
  featuredBrick,
  registryBricks,
}: {
  globalsCss: string;
  pageTsx: string;
  npmPackage: string;
  siteUrl: string;
  featuredBrick: string;
  registryBricks: string[];
}) {
  return (
    <Stack gap={4} className="w-full min-w-0">
      <Stack gap={2}>
        <Heading level={3} className="text-sm font-semibold">
          Prerequisites
        </Heading>
        <Stack gap={1} className="text-sm">
          <Text variant="muted">Node.js 22 or newer and pnpm 9.</Text>
          <Text variant="muted">React 19 and Tailwind CSS v4 (Create Next App with the Tailwind option).</Text>
          <Text variant="muted">Run the steps below in a fresh Next.js app before expecting styled components.</Text>
        </Stack>
      </Stack>
      <Stack gap={2}>
        <Heading level={3} className="text-sm font-semibold">
          1. Wire styles in <Text as="span" className="font-mono text-sm">src/app/globals.css</Text>
        </Heading>
        <SecretField
          value={globalsCss}
          aria-label="globals.css contents"
          copyLabel="Copy globals.css"
        />
      </Stack>
      <Stack gap={2}>
        <Heading level={3} className="text-sm font-semibold">
          2. Install the package
        </Heading>
        <HomeInstallCommands
          npmPackage={npmPackage}
          siteUrl={siteUrl}
          featuredBrick={featuredBrick}
          registryBricks={registryBricks}
        />
      </Stack>
      <Stack gap={2}>
        <Heading level={3} className="text-sm font-semibold">
          3. Render a button in <Text as="span" className="font-mono text-sm">src/app/page.tsx</Text>
        </Heading>
        <SecretField value={pageTsx} aria-label="page.tsx example" copyLabel="Copy page.tsx" />
        <Text variant="muted" className="text-sm">
          Run <Text as="span" className="font-mono text-sm">pnpm dev</Text> — you should see a styled{" "}
          <Text as="span" className="font-semibold">Save</Text> button. The live preview below uses the same
          components on this site.
        </Text>
      </Stack>
    </Stack>
  );
}
