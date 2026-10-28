"use client";

import { useState } from "react";
import { Combobox, Stack, Text, type ComboboxOption, zedkitUiMessagesEn, ZedkitUiProvider } from "@zedtech/zedkit-ui";

const CITIES: ComboboxOption[] = [
  { value: "paris", label: "Paris" },
  { value: "lyon", label: "Lyon" },
  { value: "marseille", label: "Marseille" },
  { value: "toulouse", label: "Toulouse" },
];

export function ComboboxDemo() {
  const [city, setCity] = useState<string | null>(null);
  return (
    <ZedkitUiProvider messages={zedkitUiMessagesEn}>
      <Stack gap={2} className="min-w-0 max-w-sm">
        <Combobox
          options={CITIES}
          value={city}
          onValueChange={setCity}
          aria-label="Office city"
          placeholder="Search cities…"
        />
        <Text variant="muted" className="text-xs" aria-live="polite">
          {city ? `Selected: ${CITIES.find((entry) => entry.value === city)?.label ?? city}` : "Type to filter the list."}
        </Text>
      </Stack>
    </ZedkitUiProvider>
  );
}
