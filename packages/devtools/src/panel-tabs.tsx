"use client";

import type { ReactNode } from "react";
import { IdentitySwitcher, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Stack, TabsContent, Text } from "@zedtech/zedkit-ui";

import { FlagOverridesTab } from "./flag-overrides-tab.js";
import type { DevtoolsBuildInfoRow, DevtoolsLocaleOption } from "./panel-types.js";

export function LookTab() {
  return <IdentitySwitcher showLabel label="Identity" />;
}

export function FlagsTabContent({ flagKeys }: { flagKeys: readonly string[] }) {
  return (
    <TabsContent value="flags">
      <FlagOverridesTab flagKeys={flagKeys} />
    </TabsContent>
  );
}

export function LocaleTabContent({
  localeOptions,
  activeLocale,
  onLocaleChange,
}: {
  localeOptions: readonly DevtoolsLocaleOption[];
  activeLocale?: string;
  onLocaleChange: (localeId: string) => void;
}) {
  return (
    <TabsContent value="locale">
      <Stack gap={2}>
        <Label htmlFor="devtools-locale">Messages locale</Label>
        <Select value={activeLocale} onValueChange={onLocaleChange}>
          <SelectTrigger id="devtools-locale">
            <SelectValue placeholder="Choose locale" />
          </SelectTrigger>
          <SelectContent>
            {localeOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>
    </TabsContent>
  );
}

export function InfoTabContent({ buildInfo }: { buildInfo: readonly DevtoolsBuildInfoRow[] }) {
  return (
    <TabsContent value="info">
      <Stack gap={2}>
        {buildInfo.map((row) => (
          <Stack key={row.label} direction="horizontal" gap={2} className="items-center justify-between text-sm">
            <Text variant="muted">{row.label}</Text>
            <Text>{row.value}</Text>
          </Stack>
        ))}
      </Stack>
    </TabsContent>
  );
}

export function QueryTabContent({ querySlot }: { querySlot: ReactNode }) {
  return <TabsContent value="query">{querySlot}</TabsContent>;
}
