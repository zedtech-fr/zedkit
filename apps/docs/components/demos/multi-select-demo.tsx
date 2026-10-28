"use client";

import { useState } from "react";
import {
  MultiSelect,
  Stack,
  Text,
  type ComboboxOption,
  zedkitUiMessagesEn,
  ZedkitUiProvider,
} from "@zedtech/zedkit-ui";

const TAGS: ComboboxOption[] = [
  { value: "design", label: "Design" },
  { value: "docs", label: "Docs" },
  { value: "infra", label: "Infra" },
  { value: "release", label: "Release" },
];

export function MultiSelectDemo() {
  const [tags, setTags] = useState<string[]>(["docs"]);
  return (
    <ZedkitUiProvider messages={zedkitUiMessagesEn}>
      <Stack gap={2} className="min-w-0 max-w-sm">
        <MultiSelect options={TAGS} value={tags} onValueChange={setTags} aria-label="Filter tags" placeholder="Add tags…" />
        <Text variant="muted" className="text-xs" aria-live="polite">
          {tags.length === 0 ? "Pick one or more tags." : `${tags.length} tag(s) selected.`}
        </Text>
      </Stack>
    </ZedkitUiProvider>
  );
}
