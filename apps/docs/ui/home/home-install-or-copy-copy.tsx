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
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_TWO_COL,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
  HOME_SECTION_CONTENT_GAP,
} from "@/ui/home/home-rhythm";

export function HomeInstallOrCopyCopy({
  packageInstallCmd,
  registryAddCmd,
  registryBricks,
}: {
  packageInstallCmd: string;
  registryAddCmd: string;
  registryBricks: string[];
}) {
  return (
    <Stack gap={HOME_SECTION_CONTENT_GAP} className="w-full min-w-0">
      <Text className={HOME_PERSUASION_TEXT_CLASS}>
        Install versioned npm packages for the full kit, or copy a growing set of UI bricks into your
        repo with the shadcn CLI (requires a <Text as="span" className={HOME_METADATA_TEXT_CLASS}>components.json</Text>
        ). Everything else stays npm-only.
      </Text>
      <div className={HOME_CARD_GRID_TWO_COL}>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Install as packages</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap={HOME_CARD_CONTENT_GAP}>
              <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                Choose this when you want one import surface, semver updates, and the full token theme
                from the package.
              </Text>
              <SecretField
                multiline
                value={packageInstallCmd}
                aria-label="Package install command"
                copyLabel="Copy package install command"
              />
            </Stack>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Copy the source into your project</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap={HOME_CARD_CONTENT_GAP}>
              <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
                Choose this when you want the component files in your repo. You get the source under{" "}
                <Text as="span" className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}>components/ui/</Text>, its npm dependencies,
                and the CSS variables it needs in your globals.
              </Text>
              <SecretField
                multiline
                value={registryAddCmd}
                aria-label="shadcn registry add command"
                copyLabel="Copy shadcn registry command"
              />
            </Stack>
          </CardContent>
        </Card>
      </div>
      <Text className={HOME_METADATA_TEXT_CLASS}>
        Published registry bricks today: <RegistryBrickList names={registryBricks} />. After copying,
        the files are yours — no automatic updates.
      </Text>
      <Text className={HOME_METADATA_TEXT_CLASS}>
        MIT license. Built on Radix and shadcn/ui-derived code. No proprietary runtime — you own what you
        copy.
      </Text>
      <Stack gap={HOME_CARD_CONTENT_GAP}>
        <Text className={HOME_METADATA_TEXT_CLASS}>
          Nothing in the catalog is labeled <Text as="span" className="font-mono">stable</Text> yet. Pin
          versions, prefer beta needs where they exist, and read the{" "}
          <Link href="/docs/maturity-and-compatibility">maturity legend</Link> before you ship.
        </Text>
        <Text className={HOME_METADATA_TEXT_CLASS}>
          Flexibility: theme tokens (colors, radius, focus rings, control sizes, dark/light) ship with the
          npm package; copied bricks are plain editable files in your tree.
        </Text>
      </Stack>
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
