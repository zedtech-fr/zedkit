"use client";

import { useId } from "react";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import {
  HeroDemoIdentitySelect,
  HeroDemoModeSelect,
  HeroDemoPreviewSelect,
} from "@/components/hero-demo-style-fields";

/** Bounded demo chrome: identity, mode, and table state for the hero specimen only. */
export function HeroDemoStyleControl({
  look,
  dark,
  preview,
  onLook,
  onDark,
  onPreview,
}: {
  look: string;
  dark: boolean;
  preview: string;
  onLook: (id: string) => void;
  onDark: (dark: boolean) => void;
  onPreview: (mode: string) => void;
}) {
  const labelId = useId();
  return (
    <Stack
      direction="horizontal"
      gap={2}
      className="flex-wrap items-center"
      role="group"
      aria-labelledby={labelId}
      data-hero-demo-display=""
    >
      <Text id={labelId} variant="muted" className={`${HOME_METADATA_TEXT_CLASS} shrink-0`}>
        Display
      </Text>
      <HeroDemoIdentitySelect look={look} onLook={onLook} />
      <HeroDemoModeSelect dark={dark} onDark={onDark} />
      <HeroDemoPreviewSelect preview={preview} onPreview={onPreview} />
    </Stack>
  );
}
