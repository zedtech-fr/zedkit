import { cn, Stack, Text } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";
import { foundationsSwatches } from "@/lib/foundations-swatches";

function SwatchMark({ tokenClass, label }: { tokenClass: string; label: string }) {
  return (
    <Stack gap="tight">
      <Text
        as="span"
        aria-hidden="true"
        className={cn("block min-h-bar w-full rounded-lg border border-border", tokenClass)}
      />
      <Text typeRole="label">{label}</Text>
    </Stack>
  );
}

export function FoundationsColor() {
  return (
    <FoundationsBand id="color" rule={copy.rules.color}>
      <Stack gap="md" className="grid content-shrink grid-pair md:grid-quad" data-palette-dots="">
        {foundationsSwatches.map((swatch) => (
          <SwatchMark
            key={swatch.id}
            tokenClass={swatch.tokenClass}
            label={copy.swatches[swatch.id]}
          />
        ))}
      </Stack>
    </FoundationsBand>
  );
}
