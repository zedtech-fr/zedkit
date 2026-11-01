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
import { homeCopy } from "@/ui/home/i18n/home-copy";

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
  const q = homeCopy.getStarted.quickstart;
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} id="quickstart" className="scroll-mt-24">
      <Text variant="muted" className={HOME_PERSUASION_TEXT_CLASS}>
        {q.introBeforeButton}
        <Text as="span" className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}>
          {q.introButtonWord}
        </Text>
        {q.introMiddle}
        <Text as="span" className={`font-mono ${HOME_METADATA_TEXT_CLASS}`}>
          {q.introSaveWord}
        </Text>
        {q.introAfterSave}
      </Text>
      <div className={HOME_CARD_GRID_TWO_COL}>
        <QuickstartPathCard
          title={q.npmCardTitle}
          description={q.npmCardDescription}
          fields={[
            {
              label: q.npmFields.installLabel,
              value: npmInstallCmd,
              copyLabel: q.npmFields.installCopy,
            },
            {
              label: q.npmFields.cssLabel,
              value: npmGlobalsCss,
              copyLabel: q.npmFields.cssCopy,
            },
            {
              label: q.npmFields.pageLabel,
              value: npmPageTsx,
              copyLabel: q.npmFields.pageCopy,
            },
          ]}
        />
        <QuickstartPathCard
          title={q.registryCardTitle}
          description={q.registryCardDescription}
          fields={[
            {
              label: q.registryFields.themeLabel,
              value: registryThemeAddCmd,
              copyLabel: q.registryFields.themeCopy,
            },
            {
              label: q.registryFields.buttonLabel,
              value: registryAddCmd,
              copyLabel: q.registryFields.buttonCopy,
            },
            {
              label: q.registryFields.pageLabel,
              value: registryPageTsx,
              copyLabel: q.registryFields.pageCopy,
            },
          ]}
        />
      </div>
    </Stack>
  );
}
