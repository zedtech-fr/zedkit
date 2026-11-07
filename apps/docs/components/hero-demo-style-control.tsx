"use client";

import { useId } from "react";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";
import {
  HeroDemoIdentitySelect,
  HeroDemoModeSelect,
  HeroDemoPreviewSelect,
  type HeroDemoModePin,
} from "@/components/hero-demo-style-fields";
import { heroDemoStyleCopy } from "@/components/i18n/hero-demo-style-copy";

/** Bounded demo chrome: identity, mode, and (with the table) table state, for the hero specimen only. */
export function HeroDemoStyleControl({
  look,
  modePin,
  preview,
  showPreview = true,
  onLook,
  onModePin,
  onPreview,
}: {
  look: string;
  modePin: HeroDemoModePin;
  preview: string;
  /** Table state only means something while the table is on show. */
  showPreview?: boolean;
  onLook: (id: string) => void;
  onModePin: (pin: HeroDemoModePin) => void;
  onPreview: (mode: string) => void;
}) {
  const labelId = useId();
  return (
    <Stack
      gap={2}
      className="content-shrink sm:flex-row sm:flex-wrap sm:items-center"
      role="group"
      aria-labelledby={labelId}
      data-hero-demo-display=""
    >
      <Text id={labelId} variant="muted" className={`${HOME_METADATA_TEXT_CLASS} shrink-0`}>
        {heroDemoStyleCopy.display}
      </Text>
      <Stack gap={2} data-hero-demo-fields="" className="content-shrink">
        <HeroDemoIdentitySelect look={look} onLook={onLook} />
        <HeroDemoModeSelect modePin={modePin} onModePin={onModePin} />
        {showPreview ? <HeroDemoPreviewSelect preview={preview} onPreview={onPreview} className="shrink-0" /> : null}
      </Stack>
    </Stack>
  );
}
