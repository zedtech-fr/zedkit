import {
  Badge,
  Button,
  cn,
  Stack,
  Surface,
  Text,
  ThemeScope,
} from "@zedtech/zedkit-ui";

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
  const pageSwatches = foundationsSwatches.filter((swatch) => swatch.scope === "page");
  const panelSwatches = foundationsSwatches.filter((swatch) => swatch.scope === "panel");

  return (
    <FoundationsBand id="color" rule={copy.rules.color}>
      <Stack gap="lg" data-palette-dots="">
        <Stack gap="md" className="grid content-shrink sm:grid-pair">
          {pageSwatches.map((swatch) => (
            <SwatchMark
              key={swatch.id}
              tokenClass={swatch.tokenClass}
              label={copy.swatches[swatch.id as "page" | "text"]}
            />
          ))}
        </Stack>
        <Stack gap="sm">
          <Text typeRole="label">{copy.swatches.siteAction}</Text>
          <Button type="button" data-site-action="">
            {copy.buttons.sitePrimary}
          </Button>
        </Stack>
        <ThemeScope identity="glass">
          <Surface variant="glass" elevation={0} padding="card" radius="xl">
            <Stack gap="md">
              <Text typeRole="label">{copy.swatches.panelTitle}</Text>
              <Text typeRole="small" variant="muted">
                {copy.swatches.panelBody}
              </Text>
              <Stack gap="md" className="grid content-shrink sm:grid-pair">
                {panelSwatches.map((swatch) => (
                  <SwatchMark
                    key={swatch.id}
                    tokenClass={swatch.tokenClass}
                    label={copy.swatches[swatch.id as "indigo" | "violet"]}
                  />
                ))}
              </Stack>
              <Stack direction="horizontal" gap="sm" className="flex-wrap">
                <Badge>{copy.chips.ai}</Badge>
                <Badge className="border-transparent bg-accent text-accent-foreground">
                  {copy.chips.ui}
                </Badge>
              </Stack>
            </Stack>
          </Surface>
        </ThemeScope>
      </Stack>
    </FoundationsBand>
  );
}
