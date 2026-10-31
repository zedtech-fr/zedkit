import Link from "next/link";
import { Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { MaturityBadge } from "@/components/maturity-badge";
import type { CatalogIndexEntry } from "@/content/catalog-index";
import { groupCatalogResults } from "@/lib/catalog-result-groups.mjs";

function CatalogRow({ entry }: { entry: CatalogIndexEntry }) {
  return (
    <Stack
      direction="horizontal"
      gap={3}
      className="flex-wrap items-center justify-between border-b border-border pb-3"
    >
      <Stack gap={1} className="min-w-0 flex-1">
        <Link href={entry.href} className="font-medium underline-offset-4 hover:underline">
          {entry.title}
        </Link>
        <Text variant="muted" className="text-sm">
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
    <Stack className="grid min-w-0 gap-x-12 gap-y-3 xl:grid-cols-2">
      {halves.map((half, index) => (
        <Stack key={index} gap={3} className="min-w-0">
          {half.map((entry) => (
            <CatalogRow key={entry.href} entry={entry} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

/** Result rows — separate chunk so filters + shell hydrate first (#618). */
export function CatalogResults({ filtered }: { filtered: CatalogIndexEntry[] }) {
  const groups = groupCatalogResults(filtered);
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
        <Stack gap={8} data-catalog-results="">
          {groups.length > 1 ? (
            <nav aria-label="Jump to category" className="xl:hidden">
              <Stack direction="horizontal" gap={2} className="flex-wrap">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`#catalog-group-${group.id}`}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {group.label} ({group.entries.length})
                  </Link>
                ))}
              </Stack>
            </nav>
          ) : null}
          {groups.map((group) => (
            <Stack key={group.id} gap={3} id={`catalog-group-${group.id}`} data-catalog-group={group.id}>
              <Heading level={3} className="text-lg">
                {group.label} · {group.entries.length}
              </Heading>
              <EntryColumns entries={group.entries} />
            </Stack>
          ))}
        </Stack>
      )}
    </Section>
  );
}
