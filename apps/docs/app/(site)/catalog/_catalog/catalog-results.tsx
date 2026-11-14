import Link from "next/link";
import { Stack, Surface, Text } from "@zedtech/zedkit-ui";
import { MaturityBadge } from "@/components/maturity-badge";
import type { CatalogIndexEntry } from "@/content/catalog-index";
import { catalogCopy } from "./i18n/catalog-copy";

function CatalogCell({ entry }: { entry: CatalogIndexEntry }) {
  return (
    <Stack gap="tight" data-catalog-cell="" className="content-shrink hover-lift surface-pad-compact">
      <Stack direction="horizontal" gap="sm" className="content-shrink flex-wrap items-start justify-between">
        <Link
          href={entry.href}
          data-catalog-title=""
          className="hit-target font-medium wrap-anywhere link-offset focus-ring hover:underline"
        >
          {entry.title}
        </Link>
        <MaturityBadge status={entry.status} />
      </Stack>
      <Text variant="muted">{entry.need}</Text>
    </Stack>
  );
}

/** Result cells — separate chunk so filters + shell hydrate first (#618). */
export function CatalogResultsBody({ filtered }: { filtered: CatalogIndexEntry[] }) {
  return (
    <Stack gap="md" data-catalog-results-root="">
      <section data-slot="section" aria-label={catalogCopy.results.sectionAriaLabel}>
        {filtered.length === 0 ? (
          <Stack gap="sm">
            <Text variant="muted">{catalogCopy.results.empty}</Text>
            <Link href="/catalog" className="text-dense text-primary link-offset hover:underline">
              {catalogCopy.results.clearFiltersLink}
            </Link>
          </Stack>
        ) : (
          <Surface
            elevation={0}
            radius="xl"
            padding="none"
            className="grid overflow-hidden"
            data-catalog-results=""
          >
            {filtered.map((entry) => (
              <CatalogCell key={entry.href} entry={entry} />
            ))}
          </Surface>
        )}
      </section>
    </Stack>
  );
}
