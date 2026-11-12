import { Stack, Text, ThemeScope } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";
import { foundationsSwatches, type FoundationsSwatch } from "@/lib/foundations-swatches";

function SwatchMark({ swatch }: { swatch: FoundationsSwatch }) {
  const mark = (
    <Stack gap="tight">
      <Text
        as="span"
        aria-hidden="true"
        data-foundations-swatch={swatch.id}
        className="block w-full rounded-lg"
      />
      <Text typeRole="label">{copy.swatches[swatch.id]}</Text>
      <Text typeRole="small" variant="muted" className="font-mono">
        {swatch.hex}
      </Text>
    </Stack>
  );
  if (swatch.scope === "panel") {
    return <ThemeScope identity="glass">{mark}</ThemeScope>;
  }
  return mark;
}

export function FoundationsColor() {
  return (
    <FoundationsBand id="color" rule={copy.rules.color}>
      <Stack gap="md" className="grid content-shrink" data-palette-dots="">
        {foundationsSwatches.map((swatch) => (
          <SwatchMark key={swatch.id} swatch={swatch} />
        ))}
      </Stack>
    </FoundationsBand>
  );
}
