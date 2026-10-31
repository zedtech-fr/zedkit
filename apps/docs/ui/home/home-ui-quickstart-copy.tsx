"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SecretField,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import {
  HOME_CARD_CONTENT_GAP,
  HOME_CARD_GRID_TWO_COL,
  HOME_METADATA_TEXT_CLASS,
  HOME_PERSUASION_TEXT_CLASS,
} from "@/ui/home/home-rhythm";

function QuickstartPathCard({
  title,
  description,
  fields,
}: {
  title: string;
  description: string;
  fields: { label: string; value: string; copyLabel: string }[];
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap={HOME_CARD_CONTENT_GAP}>
          <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
            {description}
          </Text>
          {fields.map((field) => (
            <SecretField
              key={field.copyLabel}
              multiline
              value={field.value}
              aria-label={field.label}
              copyLabel={field.copyLabel}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function HomeUiQuickstartCopy({
  npmInstallCmd,
  npmGlobalsCss,
  npmPageTsx,
  registryThemeAddCmd,
  registryAddCmd,
  registryPageTsx,
}: {
  npmInstallCmd: string;
  npmGlobalsCss: string;
  npmPageTsx: string;
  registryThemeAddCmd: string;
  registryAddCmd: string;
  registryPageTsx: string;
}) {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="quickstart" className="scroll-mt-24">
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        Two self-contained paths — npm installs the package; registry copies{" "}
        <Text as="span" className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}>Button</Text> into your
        tree. Same <Text as="span" className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}>Save</Text>{" "}
        button in each.
      </Text>
      <div className={HOME_CARD_GRID_TWO_COL}>
        <QuickstartPathCard
          title="npm package"
          description="Install @zedtech/zedkit-ui, wire Tailwind + kit CSS, import Button from the package."
          fields={[
            {
              label: "Package install command",
              value: npmInstallCmd,
              copyLabel: "Copy npm install command",
            },
            {
              label: "Tailwind and kit CSS",
              value: npmGlobalsCss,
              copyLabel: "Copy npm globals.css",
            },
            {
              label: "App entry using Button",
              value: npmPageTsx,
              copyLabel: "Copy npm page.tsx",
            },
          ]}
        />
        <QuickstartPathCard
          title="shadcn registry"
          description="After shadcn init, add theme tokens then button — import from your local components path (no @zedtech/zedkit-ui)."
          fields={[
            {
              label: "Add theme registry item",
              value: registryThemeAddCmd,
              copyLabel: "Copy registry theme command",
            },
            {
              label: "Add button registry item",
              value: registryAddCmd,
              copyLabel: "Copy registry button command",
            },
            {
              label: "App entry using copied Button",
              value: registryPageTsx,
              copyLabel: "Copy registry page.tsx",
            },
          ]}
        />
      </div>
    </Stack>
  );
}
