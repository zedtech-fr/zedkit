"use client";

import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { SecretField, Stack, Text } from "@zedtech/zedkit-ui";

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
  const brickList = registryBricks.join(", ");
  return (
    <Stack gap={2} className="w-full min-w-0">
      <Tabs items={["pnpm (recommended)", "shadcn registry"]} className="w-full">
        <Tab value="pnpm (recommended)">
          <SecretField
            value={`pnpm add ${npmPackage}`}
            aria-label="pnpm install command"
            copyLabel="Copy pnpm command"
          />
        </Tab>
        <Tab value="shadcn registry">
          <SecretField
            value={shadcnAdd}
            aria-label="shadcn add command"
            copyLabel="Copy shadcn command"
          />
        </Tab>
      </Tabs>
      <Text variant="muted" className="text-sm">
        npm install adds the full package. The shadcn tab copies one brick ({featuredBrick}); published
        registry items on this host: {brickList} (
        <Text as="span" className="font-mono text-sm">/r/&lt;name&gt;.json</Text>).
      </Text>
    </Stack>
  );
}
