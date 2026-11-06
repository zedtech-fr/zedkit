"use client";

import { useEffect, useState } from "react";
import { Label, Stack, Switch, Text } from "@zedtech/zedkit-ui";
import { readFlagOverrides, subscribeFlagOverrides, writeFlagOverride } from "@zedtech/zedkit-flags";

export type FlagOverridesTabProps = {
  flagKeys: readonly string[];
};

export function FlagOverridesTab({ flagKeys }: FlagOverridesTabProps) {
  const [overrides, setOverrides] = useState(() =>
    readFlagOverrides(typeof localStorage === "undefined" ? null : localStorage),
  );

  useEffect(() => {
    return subscribeFlagOverrides(() => {
      setOverrides(readFlagOverrides(typeof localStorage === "undefined" ? null : localStorage));
    });
  }, []);

  if (flagKeys.length === 0) {
    return <Text variant="muted">Pass `flagKeys` to override flags in local storage.</Text>;
  }

  return (
    <Stack gap={3}>
      {flagKeys.map((key) => {
        const on = key in overrides ? Boolean(overrides[key]) : false;
        const id = `devtools-flag-${key}`;
        return (
          <Stack key={key} direction="horizontal" gap={2} className="items-center justify-between">
            <Label htmlFor={id}>{key}</Label>
            <Switch
              id={id}
              checked={on}
              onCheckedChange={(checked) => {
                writeFlagOverride(localStorage, key, checked ? true : false);
              }}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}
