import { Stack, Text, ThemeScope } from "@zedtech/zedkit-ui";

import { foundationsSwatches, type FoundationsSwatch } from "../foundations-swatches";
import { foundationsCopy as copy } from "../i18n/foundations-copy";
import { FoundationsBand } from "./foundations-band";

function SwatchMark({ swatch }: { swatch: FoundationsSwatch }) {
  const chip = (
    <Text
      as="span"
      aria-hidden="true"
      data-foundations-swatch={swatch.id}
      className="block w-full rounded-lg"
    />
  );
  return (
    <Stack gap="tight">
      {swatch.scope === "panel" ? <ThemeScope identity="glass">{chip}</ThemeScope> : chip}
      <Text typeRole="label">{copy.swatches[swatch.id]}</Text>
      <Text typeRole="small" variant="muted" className="font-mono">
        {swatch.hex}
      </Text>
    </Stack>
  );
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
