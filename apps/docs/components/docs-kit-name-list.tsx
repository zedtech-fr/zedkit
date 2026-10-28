"use client";

import { ScanSearch, SquareSlash } from "lucide-react";
import { IconLabel, Text } from "@zedtech/zedkit-ui";

const ICONS = {
  command: SquareSlash,
  lens: ScanSearch,
} as const;

export function DocsKitNameList({
  kind,
  names,
}: {
  kind: keyof typeof ICONS;
  names: readonly string[];
}) {
  return (
    <Text
      as="span"
      data-kit-names={kind}
      className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
    >
      {names.map((name) => (
        <IconLabel key={name} icon={ICONS[kind]}>
          <code>{name}</code>
        </IconLabel>
      ))}
    </Text>
  );
}
