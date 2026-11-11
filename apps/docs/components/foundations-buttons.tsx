import { Button, Stack, Surface, Text, ThemeScope } from "@zedtech/zedkit-ui";

import { FoundationsBand } from "@/components/foundations-band";
import { foundationsCopy as copy } from "@/components/i18n/foundations-copy";

export function FoundationsButtons() {
  return (
    <FoundationsBand id="buttons" rule={copy.rules.buttons}>
      <Stack gap="md">
        <Surface variant="solid" elevation={0} padding="card" radius="xl">
          <Stack gap="md">
            <Text typeRole="label">{copy.buttons.siteTitle}</Text>
            <Stack direction="horizontal" gap="sm" className="flex-wrap">
              <Button type="button" data-site-action="">
                {copy.buttons.sitePrimary}
              </Button>
              <Button type="button" variant="outline" data-site-action="">
                {copy.buttons.siteSecondary}
              </Button>
              <Button type="button" variant="link">
                {copy.buttons.siteLink}
              </Button>
            </Stack>
          </Stack>
        </Surface>
        <ThemeScope identity="glass">
          <Surface variant="solid" elevation={0} padding="card" radius="xl">
            <Stack gap="md">
              <Text typeRole="label">{copy.buttons.kitTitle}</Text>
              <Stack direction="horizontal" gap="sm" className="flex-wrap">
                <Button type="button">{copy.buttons.kitPrimary}</Button>
                <Button type="button" variant="outline">
                  {copy.buttons.kitSecondary}
                </Button>
                <Button type="button" variant="outline" className="text-destructive">
                  {copy.buttons.kitDestructive}
                </Button>
              </Stack>
            </Stack>
          </Surface>
        </ThemeScope>
      </Stack>
    </FoundationsBand>
  );
}
