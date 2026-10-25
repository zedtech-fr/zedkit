"use client";

import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { SecretField, Stack, Text } from "@zedtech/zedkit-ui";

/** Copyable install commands for the home hero (npm + shadcn registry URL). */
export function HomeInstallCommands({ npmPackage }: { npmPackage: string }) {
  const registryBrick = "badge";
  const commands = {
    npm: `pnpm add ${npmPackage}`,
    shadcn: `npx shadcn@latest add https://zedkit.app/r/${registryBrick}.json`,
  };
  return (
    <Stack gap={2} className="w-full">
      <Tabs items={["npm", "shadcn (preview)"]} className="w-full">
        <Tab value="npm">
          <SecretField
            value={commands.npm}
            aria-label="pnpm install command"
            copyLabel="Copy pnpm command"
          />
        </Tab>
        <Tab value="shadcn (preview)">
          <SecretField
            value={commands.shadcn}
            aria-label="shadcn add command"
            copyLabel="Copy shadcn command"
          />
        </Tab>
      </Tabs>
      <Text variant="muted" className="text-sm">
        npm install works today. The shadcn URL targets{" "}
        <Text as="span" className="font-mono text-sm">
          /r/{registryBrick}.json
        </Text>{" "}
        on this host once the registry lane publishes those files.
      </Text>
    </Stack>
  );
}
