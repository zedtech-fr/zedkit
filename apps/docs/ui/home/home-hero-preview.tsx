import { Card, Stack } from "@zedtech/zedkit-ui";
import { HomeAdminScene } from "@/ui/home/home-admin-scene";

/**
 * Hero visual: live kit components in the page identity. Decorative only.
 */
export function HomeHeroPreview() {
  return (
    <Stack
      aria-hidden="true"
      className="pointer-events-none min-h-72 w-full lg:min-h-80"
      data-home-hero-preview
    >
      <Card className="h-full min-h-72 select-none lg:min-h-80">
        <Stack className="h-full justify-between p-card-padding">
          <HomeAdminScene />
        </Stack>
      </Card>
    </Stack>
  );
}
