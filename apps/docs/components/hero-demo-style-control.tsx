"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  identities,
} from "@zedtech/zedkit-ui";

const MODES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

/** Bounded demo chrome: identity + color mode for the hero specimen only (never the site shell). */
export function HeroDemoStyleControl({
  look,
  dark,
  onLook,
  onDark,
}: {
  look: string;
  dark: boolean;
  onLook: (id: string) => void;
  onDark: (dark: boolean) => void;
}) {
  const labelId = useId();
  return (
    <Stack gap={2} role="group" aria-labelledby={labelId} data-hero-demo-style>
      <Text id={labelId} variant="muted" className="text-sm">
        Style of this demo
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
        <Select value={look} onValueChange={onLook}>
          <SelectTrigger className="min-w-0 flex-1 sm:w-40" aria-label="Identity for this demo">
            <SelectValue placeholder="Identity" />
          </SelectTrigger>
          <SelectContent>
            {identities.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dark ? "dark" : "light"} onValueChange={(value) => onDark(value === "dark")}>
          <SelectTrigger className="w-28" aria-label="Color mode for this demo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODES.map((mode) => (
              <SelectItem key={mode.id} value={mode.id}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>
    </Stack>
  );
}
