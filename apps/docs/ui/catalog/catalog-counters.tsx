import { Stack, Surface, Text } from "@zedtech/zedkit-ui";
import { catalogCounterItems } from "@/lib/catalog-filter.mjs";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

export function CatalogCounters({
  counts,
}: {
  counts: { ui: number; backend: number; seo: number; agents: number };
}) {
  const items = catalogCounterItems(counts, catalogCopy.counters.labels);
  return (
    <Stack
      gap="sm"
      className="content-shrink rounded-2xl"
      data-catalog-counters=""
      role="group"
      aria-label={catalogCopy.counters.ariaLabel}
    >
      <Surface
        variant="glass"
        radius="xl"
        padding="md"
        className="grid grid-quad gap-stack-sm"
        data-catalog-counters-panel=""
      >
        {items.map((item) => (
          <Stack key={item.id} gap="tight">
            <Text className="text-stat tabular-nums">{item.count}</Text>
            <Text variant="muted">{item.label}</Text>
          </Stack>
        ))}
      </Surface>
    </Stack>
  );
}
