"use client";

import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SecretField,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { DocsActionLabel } from "@/components/docs-action-label";
import { RegistryBrickList } from "@/components/registry-brick-name";
import { HOME_CARD_CONTENT_GAP, HOME_CARD_GRID_TWO_COL } from "@/ui/home/home-rhythm";

function InstallOrCopyCards({
  packageInstallCmd,
  registryAddCmd,
}: {
  packageInstallCmd: string;
  registryAddCmd: string;
}) {
  return (
    <div className={HOME_CARD_GRID_TWO_COL}>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Install as packages</CardTitle>
        </CardHeader>
        <CardContent>
          <SecretField
            multiline
            value={packageInstallCmd}
            aria-label="Package install command"
            copyLabel="Copy package install command"
          />
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Copy the source into your project</CardTitle>
        </CardHeader>
        <CardContent>
          <SecretField
            multiline
            value={registryAddCmd}
            aria-label="shadcn registry add command"
            copyLabel="Copy shadcn registry command"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function HomeGetStartedInstallBlock({
  packageInstallCmd,
  registryAddCmd,
  registryBricks,
}: {
  packageInstallCmd: string;
  registryAddCmd: string;
  registryBricks: string[];
}) {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="install-or-copy" className="scroll-mt-24">
      <Text variant="muted">
        npm packages for the full kit, or copy UI bricks with the shadcn CLI when you have a{" "}
        <Text as="span" className="font-mono text-sm">components.json</Text>.
      </Text>
      <InstallOrCopyCards packageInstallCmd={packageInstallCmd} registryAddCmd={registryAddCmd} />
      <Text variant="muted" className="text-sm">
        Published registry bricks today: <RegistryBrickList names={registryBricks} />.
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap" data-docs-ctas="">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/zedkit-and-shadcn">
            <DocsActionLabel>zedkit and shadcn/ui</DocsActionLabel>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/docs/getting-started#install-or-copy">
            <DocsActionLabel>Getting started</DocsActionLabel>
          </Link>
        </Button>
      </Stack>
    </Stack>
  );
}
