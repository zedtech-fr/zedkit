import { Badge, Button, Stack, StatusLabel, Surface, ThemeScope } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";

export function FoundationsChips() {
  return (
    <FoundationsBand id="chips" rule={copy.rules.chips}>
      <Stack gap="md">
        <ThemeScope identity="glass">
          <Surface variant="glass" elevation={0} padding="card" radius="xl">
            <Stack direction="horizontal" gap="sm" className="flex-wrap">
              <Badge>{copy.chips.ai}</Badge>
              <Badge className="border-transparent bg-accent text-accent-foreground">
                {copy.chips.ui}
              </Badge>
              <Badge variant="secondary">{copy.chips.beta}</Badge>
              <Button type="button" size="sm" variant="outline" className="rounded-full">
                {copy.chips.selectQuiet}
              </Button>
              <Button type="button" size="sm" className="rounded-full">
                {copy.chips.selectOn}
              </Button>
            </Stack>
          </Surface>
        </ThemeScope>
        <Surface variant="solid" elevation={0} padding="card" radius="xl">
          <Stack direction="horizontal" gap="md" className="flex-wrap">
            <StatusLabel tone="saved">{copy.chips.active}</StatusLabel>
            <StatusLabel tone="error">{copy.chips.blocked}</StatusLabel>
          </Stack>
        </Surface>
      </Stack>
    </FoundationsBand>
  );
}
