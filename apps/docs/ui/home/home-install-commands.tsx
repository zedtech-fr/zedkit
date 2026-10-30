"use client";

import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { SecretField, Stack, Text } from "@zedtech/zedkit-ui";
import { RegistryBrickList, RegistryBrickName } from "@/components/registry-brick-name";

export function HomeInstallCommands({
  npmPackage,
  siteUrl,
  featuredBrick,
  registryBricks,
}: {
  npmPackage: string;
  siteUrl: string;
  featuredBrick: string;
  registryBricks: string[];
}) {
  const base = siteUrl.replace(/\/$/, "");
  const shadcnAdd = `npx shadcn@latest add ${base}/r/${featuredBrick}.json`;
  return (
    <Stack gap={2} className="w-full min-w-0">
      <Tabs items={["pnpm (recommended)", "shadcn registry"]} className="w-full">
        <Tab value="pnpm (recommended)">
          <SecretField
            multiline
            value={`pnpm add ${npmPackage}`}
            aria-label="pnpm install command"
            copyLabel="Copy pnpm command"
          />
        </Tab>
        <Tab value="shadcn registry">
          <SecretField
            multiline
            value={shadcnAdd}
            aria-label="shadcn add command"
            copyLabel="Copy shadcn command"
          />
        </Tab>
      </Tabs>
      <Text variant="muted" className="text-sm">
        npm install adds the full package. The shadcn tab copies one brick (
        <RegistryBrickName name={featuredBrick} />); published registry items on this host:{" "}
        <RegistryBrickList names={registryBricks} /> (
        <Text as="span" className="font-mono text-sm">/r/&lt;name&gt;.json</Text>).
      </Text>
    </Stack>
  );
}
