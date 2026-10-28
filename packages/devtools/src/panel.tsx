"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";

import { DevtoolsDrawerFooter, DevtoolsDrawerShell } from "./panel-shell.js";
import { FlagsTabContent, InfoTabContent, LocaleTabContent, LookTab, QueryTabContent } from "./panel-tabs.js";
import type { ZedkitDevtoolsPanelProps } from "./panel-types.js";

export type { DevtoolsBuildInfoRow, DevtoolsLocaleOption, ZedkitDevtoolsPanelProps } from "./panel-types.js";

export function ZedkitDevtoolsPanel({
  flagKeys = [],
  buildInfo = [],
  localeOptions = [],
  activeLocale,
  onLocaleChange,
  querySlot,
  triggerLabel = "Dev",
}: ZedkitDevtoolsPanelProps) {
  const showFlags = flagKeys.length > 0;
  const showLocale = localeOptions.length > 0 && onLocaleChange;
  const showQuery = Boolean(querySlot);
  const showInfo = buildInfo.length > 0;

  return (
    <DevtoolsDrawerShell triggerLabel={triggerLabel} footer={<DevtoolsDrawerFooter />}>
      <Tabs defaultValue="look">
        <TabsList className="mb-3 flex flex-wrap">
          <TabsTrigger value="look">Look</TabsTrigger>
          {showFlags ? <TabsTrigger value="flags">Flags</TabsTrigger> : null}
          {showLocale ? <TabsTrigger value="locale">Locale</TabsTrigger> : null}
          {showInfo ? <TabsTrigger value="info">Info</TabsTrigger> : null}
          {showQuery ? <TabsTrigger value="query">Query</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="look">
          <LookTab />
        </TabsContent>
        {showFlags ? <FlagsTabContent flagKeys={flagKeys} /> : null}
        {showLocale ? (
          <LocaleTabContent localeOptions={localeOptions} activeLocale={activeLocale} onLocaleChange={onLocaleChange} />
        ) : null}
        {showInfo ? <InfoTabContent buildInfo={buildInfo} /> : null}
        {showQuery && querySlot ? <QueryTabContent querySlot={querySlot} /> : null}
      </Tabs>
    </DevtoolsDrawerShell>
  );
}
