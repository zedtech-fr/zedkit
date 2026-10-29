import Link from "next/link";
import { Badge, IconLabel, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { MaturityBadge } from "@/components/maturity-badge";
import type { CatalogIndexEntry } from "@/content/catalog-index";
import { areaIconFor } from "@/lib/domain-icons";

/** Result rows — separate chunk so filters + shell hydrate first (#618). */
export function CatalogResults({ filtered }: { filtered: CatalogIndexEntry[] }) {
  return (
    <Section
      title="Results"
      description={
        <span role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </span>
      }
    >
      {filtered.length === 0 ? (
        <Text variant="muted">No catalog entries match these filters. Clear search or pick another area.</Text>
      ) : (
        <Stack gap={3}>
          {filtered.map((entry) => (
            <Stack
              key={entry.href}
              direction="horizontal"
              gap={3}
              className="flex-wrap items-center justify-between border-b border-border pb-3"
            >
              <Stack gap={1}>
                <Link href={entry.href} className="font-medium underline-offset-4 hover:underline">
                  {entry.title}
                </Link>
                <Text variant="muted" className="text-sm">
                  {entry.need}
                </Text>
              </Stack>
              <Stack direction="horizontal" gap={2} className="items-center">
                <Badge variant="outline" data-catalog-area={entry.area}>
                  <IconLabel icon={areaIconFor(entry.area)} className="text-current">
                    {entry.area}
                  </IconLabel>
                </Badge>
                <MaturityBadge status={entry.status} />
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Section>
  );
}
