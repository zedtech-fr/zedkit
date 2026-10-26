import { Badge, Button, Card, Stack, Text } from "@zedtech/zedkit-ui";

const SWATCHES = ["bg-primary", "bg-secondary", "bg-accent", "bg-muted", "bg-destructive"] as const;

/**
 * Hero visual: the same kit components, drawn by whichever identity the
 * hero is showing. It is part of the hero's identity crossfade (see
 * `IdentityCycle` in the hero), decorative only, so it is hidden from
 * assistive tech, cannot be focused and ignores the pointer.
 */
export function HomeHeroPreview() {
  return (
    <Stack aria-hidden="true" className="pointer-events-none w-full" data-home-hero-preview>
      <Card className="h-full min-h-48 select-none sm:min-h-52">
        <Stack gap={4} className="h-full justify-between p-card-padding">
          <Stack direction="horizontal" gap={2} className="items-center justify-between">
            <Badge>Admin UI</Badge>
            <Text variant="muted" className="text-xs">Six identities</Text>
          </Stack>
          <Text className="font-(family-name:--zk-font-display) text-2xl leading-tight font-semibold text-balance">
            Your product. Your voice.
          </Text>
          <Stack direction="horizontal" gap={3} className="items-center justify-between">
            <Stack direction="horizontal" gap={2}>
              {SWATCHES.map((color) => (
                <Stack key={color} className={`size-6 rounded-full border ${color}`} />
              ))}
            </Stack>
            <Button size="sm" tabIndex={-1}>
              Get started
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
