"use client";

import { IconLabel } from "@zedtech/zedkit-ui";
import { areaIconFor } from "@/features/docs/domain-icons";
import { docsAreaLabelCopy } from "@/features/docs/i18n/docs-area-label-copy";

export function DocsAreaLabel({ area }: { area: keyof typeof docsAreaLabelCopy }) {
  return <IconLabel icon={areaIconFor(area)}>{docsAreaLabelCopy[area]}</IconLabel>;
}
