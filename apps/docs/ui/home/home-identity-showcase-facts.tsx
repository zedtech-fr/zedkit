"use client";

import { cn, Stack, Text } from "@zedtech/zedkit-ui";
import type { IdentityFacts } from "@/ui/home/home-identity-facts";
import { HomeIdentityPaletteSwatches } from "@/ui/home/home-identity-showcase-swatches";
import { homeIdentityShowcaseCopy } from "@/ui/home/home-identity-showcase-copy";
import { HOME_METADATA_TEXT_CLASS } from "@/ui/home/home-rhythm";

const labels = homeIdentityShowcaseCopy.factLabels;

function FactLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={1} className="min-w-0">
      <Text className={cn("font-medium", HOME_METADATA_TEXT_CLASS)}>{label}</Text>
      <Text className="min-w-0 text-sm">{value}</Text>
    </Stack>
  );
}

export function HomeIdentityShowcaseFacts({
  facts,
  mode,
}: {
  facts: IdentityFacts;
  mode: "light" | "dark";
}) {
  return (
    <Stack gap={2} className="min-w-0">
      <FactLine label={labels.character} value={facts.character} />
      <FactLine label={labels.type} value={facts.type} />
      <FactLine label={labels.shape} value={facts.shape} />
      <FactLine label={labels.density} value={facts.density} />
      <Stack gap={1} className="min-w-0">
        <Text className={cn("font-medium", HOME_METADATA_TEXT_CLASS)}>{labels.palette}</Text>
        <HomeIdentityPaletteSwatches identity={facts.id} mode={mode} palette={facts.palette} />
      </Stack>
    </Stack>
  );
}
