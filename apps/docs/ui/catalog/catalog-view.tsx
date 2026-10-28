"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Heading, IconLabel, Input, Label, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { areaIconFor } from "@/lib/domain-icons";
import { maturityBadgeVariant } from "@/lib/maturity-status";
import type { CatalogArea, CatalogIndexEntry } from "@/content/catalog-index";

const AREAS: { id: CatalogArea | "all"; label: string }[] = [
  { id: "all", label: "All areas" },
  { id: "ui", label: "UI" },
  { id: "backend", label: "Core & server" },
  { id: "seo", label: "SEO" },
  { id: "agents", label: "Agents" },
];

export const CATALOG_DEFAULT_FILTERS = { area: "all" as const, status: "all", q: "" };

function readFilter(
  searchParams: URLSearchParams,
  entries: CatalogIndexEntry[],
): { area: CatalogArea | "all"; status: string; q: string } {
  const areaParam = searchParams.get("area") ?? "all";
  const area = AREAS.some((row) => row.id === areaParam) ? (areaParam as CatalogArea | "all") : "all";
  const statusParam = searchParams.get("status") ?? "all";
  const statuses = new Set(entries.map((entry) => entry.status));
  const status = statusParam === "all" || statuses.has(statusParam) ? statusParam : "all";
  const q = searchParams.get("q") ?? "";
  return { area, status, q };
}

export function CatalogView({
  entries,
  area = CATALOG_DEFAULT_FILTERS.area,
  status = CATALOG_DEFAULT_FILTERS.status,
  q = CATALOG_DEFAULT_FILTERS.q,
  onFilters,
}: {
  entries: CatalogIndexEntry[];
  area?: CatalogArea | "all";
  status?: string;
  q?: string;
  onFilters?: (next: { area?: string; status?: string; q?: string }) => void;
}) {
  const statuses = useMemo(() => [...new Set(entries.map((entry) => entry.status))].sort(), [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((entry) => {
      if (area !== "all" && entry.area !== area) return false;
      if (status !== "all" && entry.status !== status) return false;
      if (needle.length === 0) return true;
      const hay = `${entry.title} ${entry.need} ${entry.package}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [entries, area, status, q]);

  function setFilters(next: { area?: string; status?: string; q?: string }) {
    onFilters?.(next);
  }

  return (
    <Stack gap={8} className="mx-auto w-full max-w-5xl px-6 py-12">
      <Stack gap={2}>
        <Heading level={1}>Catalog</Heading>
        <Text variant="muted">
          Every zedkit need from the public catalog — filter by area, maturity, or search text. Share or reload
          keeps your filters in the URL.
        </Text>
      </Stack>

      <Stack gap={4} aria-labelledby="catalog-filters-heading">
        <Heading level={2} id="catalog-filters-heading" className="text-lg">
          Filters
        </Heading>
        <Stack gap={2}>
          <Text variant="muted" as="span" id="catalog-area-label">Area</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap" role="group" aria-labelledby="catalog-area-label">
            {AREAS.map((row) => (
              <Button
                key={row.id}
                type="button"
                size="sm"
                variant={area === row.id ? "default" : "outline"}
                aria-pressed={area === row.id}
                onClick={() => setFilters({ area: row.id })}
              >
                {row.id === "all" ? (
                  row.label
                ) : (
                  <IconLabel icon={areaIconFor(row.id)} className="text-current">
                    {row.label}
                  </IconLabel>
                )}
              </Button>
            ))}
          </Stack>
        </Stack>
        <Stack gap={2}>
          <Text variant="muted" as="span" id="catalog-status-label">Maturity</Text>
          <Stack direction="horizontal" gap={2} className="flex-wrap" role="group" aria-labelledby="catalog-status-label">
            <Button
              type="button"
              size="sm"
              variant={status === "all" ? "default" : "outline"}
              aria-pressed={status === "all"}
              onClick={() => setFilters({ status: "all" })}
            >
              All
            </Button>
            {statuses.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={status === value ? "default" : "outline"}
                aria-pressed={status === value}
                onClick={() => setFilters({ status: value })}
              >
                {value}
              </Button>
            ))}
          </Stack>
        </Stack>
        <Stack gap={2}>
          <Label htmlFor="catalog-search">Catalog search</Label>
          <Input
            id="catalog-search"
            type="search"
            value={q}
            onChange={(event) => setFilters({ q: event.target.value })}
            placeholder="Filter by title or need"
          />
        </Stack>
      </Stack>

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
                  <Text variant="muted" className="text-sm">{entry.need}</Text>
                </Stack>
                <Stack direction="horizontal" gap={2} className="items-center">
                  <Badge variant="outline" data-catalog-area={entry.area}>
                    <IconLabel icon={areaIconFor(entry.area)} className="text-current">
                      {entry.area}
                    </IconLabel>
                  </Badge>
                  <Badge variant={maturityBadgeVariant(entry.status)}>{entry.status}</Badge>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}

/** URL filters after mount so the first client render matches the static HTML. */
export function CatalogViewFromUrl({ entries }: { entries: CatalogIndexEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilterState] = useState<ReturnType<typeof readFilter>>(CATALOG_DEFAULT_FILTERS);

  useEffect(() => {
    const apply = () => setFilterState(readFilter(new URLSearchParams(window.location.search), entries));
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [entries]);

  function setFilters(next: { area?: string; status?: string; q?: string }) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) continue;
      if (value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setFilterState(readFilter(params, entries));
  }

  return (
    <CatalogView
      entries={entries}
      area={filters.area}
      status={filters.status}
      q={filters.q}
      onFilters={setFilters}
    />
  );
}
