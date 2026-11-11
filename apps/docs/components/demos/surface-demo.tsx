import { Stack, Surface, Text, WidgetButton } from "@zedtech/zedkit-ui";
import { surfaceCopy } from "@/components/demos/i18n/surface-copy";

/** Solid and glass panel chrome from the kit (elevation and radius tokens). */
export function SurfaceDemo() {
  return (
    <Stack gap="lg" data-example-width="medium">
      <Surface variant="solid" elevation={2} radius="xl" padding="md">
        <Text typeRole="label">{surfaceCopy.solid.label}</Text>
        <Text className="text-muted-foreground">{surfaceCopy.solid.description}</Text>
      </Surface>
      <Surface variant="glass" elevation={3} radius="xl" padding="md">
        <Text typeRole="label">{surfaceCopy.glass.label}</Text>
        <Text className="text-muted-foreground">{surfaceCopy.glass.description}</Text>
      </Surface>
      <WidgetButton type="button">{surfaceCopy.widgetTrigger}</WidgetButton>
    </Stack>
  );
}
