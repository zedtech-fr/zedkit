"use client";

import { IconLabel } from "@zedtech/zedkit-ui";
import { areaIconFor } from "@/lib/domain-icons";

const AREA_LABELS = {
  ui: "UI",
  backend: "Core & server",
  seo: "SEO",
  agents: "Coding agents",
} as const;

export function DocsAreaLabel({ area }: { area: keyof typeof AREA_LABELS }) {
  return <IconLabel icon={areaIconFor(area)}>{AREA_LABELS[area]}</IconLabel>;
}
