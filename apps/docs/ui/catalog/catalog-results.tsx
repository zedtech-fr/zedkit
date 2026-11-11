import Link from "next/link";
import { Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { MaturityBadge } from "@/components/maturity-badge";
import type { CatalogIndexEntry } from "@/content/catalog-index";
import { groupCatalogResults } from "@/lib/catalog-result-groups.mjs";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

function CatalogRow({ entry }: { entry: CatalogIndexEntry }) {
  return (
    <Stack
      direction="horizontal"
      gap="md"
      className="flex-wrap items-center justify-between border-b border-border rule-gap"
    >
      <Stack gap="tight" className="content-shrink flex-1">
        <Link href={entry.href} className="font-medium link-offset hover:underline">
          {entry.title}
        </Link>
        <Text variant="muted">
          {entry.need}
        </Text>
      </Stack>
      <MaturityBadge status={entry.status} />
    </Stack>
  );
}

function EntryColumns({ entries }: { entries: CatalogIndexEntry[] }) {
  const mid = Math.ceil(entries.length / 2);
  const halves = [entries.slice(0, mid), entries.slice(mid)];
  return (
    <Stack className="grid content-shrink gap-x-results gap-y-stack-md xl:grid-pair">
      {halves.map((half, index) => (
        <Stack key={index} gap="md" className="content-shrink">
          {half.map((entry) => (
            <CatalogRow key={entry.href} entry={entry} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function resultsStatusLine(filtered: CatalogIndexEntry[]) {
  return (
    <Text as="span" role="status" aria-live="polite">
      {catalogCopy.results.statusLine(filtered.length)}
    </Text>
  );
}

/** Results title row — lives in the default-width filters band for column alignment. */
export function CatalogResultsHeader({ filtered }: { filtered: CatalogIndexEntry[] }) {
  return (
    <Stack className="flex-row items-start justify-between" data-catalog-results-heading="">
      <Stack className="gap-flush">
        <Heading level={2} id="catalog-results-heading">
          {catalogCopy.results.heading}
        </Heading>
        <Text variant="muted">{resultsStatusLine(filtered)}</Text>
      </Stack>
    </Stack>
  );
}

/** Result rows — separate chunk so filters + shell hydrate first (#618). */
export function CatalogResultsBody({ filtered }: { filtered: CatalogIndexEntry[] }) {
  const groups = groupCatalogResults(filtered);
  return (
    <Stack gap="lg" data-catalog-results-root="">
      <section data-slot="section" className="space-y-stack-lg" aria-label={catalogCopy.results.sectionAriaLabel}>
        {filtered.length === 0 ? (
          <Stack gap="sm">
            <Text variant="muted">{catalogCopy.results.empty}</Text>
            <Link href="/catalog" className="text-dense text-primary link-offset hover:underline">
              {catalogCopy.results.clearFiltersLink}
            </Link>
          </Stack>
        ) : (
          <Stack gap="list" data-catalog-results="">
            {groups.length > 1 ? (
              <nav aria-label={catalogCopy.results.jumpNavAriaLabel} className="xl:hidden">
                <Stack direction="horizontal" gap="sm" className="flex-wrap">
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`#catalog-group-${group.id}`}
                      className="text-dense text-muted-foreground link-offset hover:text-foreground hover:underline"
                    >
                      {catalogCopy.results.groupJumpLink(group.label, group.entries.length)}
                    </Link>
                  ))}
                </Stack>
              </nav>
            ) : null}
            {groups.map((group) => (
              <Stack key={group.id} gap="md" id={`catalog-group-${group.id}`} data-catalog-group={group.id}>
                <Heading level={2} className="text-compact-heading">
                  {catalogCopy.results.groupHeading(group.label, group.entries.length)}
                </Heading>
                <EntryColumns entries={group.entries} />
              </Stack>
            ))}
          </Stack>
        )}
      </section>
    </Stack>
  );
}

/** @deprecated Use CatalogResultsHeader + CatalogResultsBody from the catalog shell. */
export function CatalogResults({ filtered }: { filtered: CatalogIndexEntry[] }) {
  return (
    <Stack gap="lg">
      <CatalogResultsHeader filtered={filtered} />
      <CatalogResultsBody filtered={filtered} />
    </Stack>
  );
}
