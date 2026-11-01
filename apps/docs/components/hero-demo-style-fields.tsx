"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, identities } from "@zedtech/zedkit-ui";

const MODES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

const PREVIEW_MODES = [
  { id: "ready", label: "Ready" },
  { id: "loading", label: "Loading" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
] as const;

export function HeroDemoIdentitySelect({ look, onLook }: { look: string; onLook: (id: string) => void }) {
  return (
    <Select value={look} onValueChange={onLook}>
      <SelectTrigger
        className="h-9 min-w-0 flex-1 border-border/70 bg-transparent shadow-none sm:w-32"
        aria-label="Identity for this demo"
      >
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
  );
}

export function HeroDemoModeSelect({ dark, onDark }: { dark: boolean; onDark: (dark: boolean) => void }) {
  return (
    <Select value={dark ? "dark" : "light"} onValueChange={(value) => onDark(value === "dark")}>
      <SelectTrigger
        className="h-9 w-24 border-border/70 bg-transparent shadow-none"
        aria-label="Color mode for this demo"
      >
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
  );
}

export function HeroDemoPreviewSelect({
  preview,
  onPreview,
}: {
  preview: string;
  onPreview: (mode: string) => void;
}) {
  return (
    <Select value={preview} onValueChange={onPreview}>
      <SelectTrigger
        className="h-9 w-28 border-border/70 bg-transparent shadow-none"
        aria-label="Table preview mode"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PREVIEW_MODES.map((mode) => (
          <SelectItem key={mode.id} value={mode.id}>
            {mode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
