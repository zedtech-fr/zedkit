"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Container, Heading, IconLabel, Input, Label, Section, Stack, Text } from "@zedtech/zedkit-ui";
import { areaIconFor } from "@/lib/domain-icons";
import type { CatalogArea, CatalogIndexEntry } from "@/content/catalog-index";

const CatalogResults = dynamic(
  () => import("@/ui/catalog/catalog-results").then((mod) => ({ default: mod.CatalogResults })),
  {
    loading: () => (
      <Stack gap={4}>
        <Container width="default">
          <Heading level={2}>Results</Heading>
          <Text variant="muted" role="status">
            Loading results…
          </Text>
        </Container>
      </Stack>
    ),
  },
);

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
    <>
      <Section bleed tone="muted" spacing="lg" containerWidth="default">
      <Stack gap={8}>
      <Stack gap={2}>
        <Heading level={1}>Catalog</Heading>
        <Text variant="muted" className="type-site-lead">
          Every zedkit need from the public catalog — filter by area, maturity, or search text. Share or reload
          keeps your filters in the URL.
        </Text>
      </Stack>

      <Stack gap={4} aria-labelledby="catalog-filters-heading">
        <Heading level={2} id="catalog-filters-heading">
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
      </Stack>
      </Section>
      <Container width="wide" className="py-section-lg">
        <CatalogResults filtered={filtered} />
      </Container>
    </>
  );
}

/** URL filters after mount so the first client render matches the static HTML. */
export function CatalogViewFromUrl({ entries }: { entries: CatalogIndexEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilterState] = useState<ReturnType<typeof readFilter>>(CATALOG_DEFAULT_FILTERS);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const next = readFilter(new URLSearchParams(searchParams.toString()), entries);
    filtersRef.current = next;
    setFilterState(next);
  }, [entries, searchParams]);

  function setFilters(next: { area?: string; status?: string; q?: string }) {
    const merged = { ...filtersRef.current, ...next };
    const params = new URLSearchParams();
    if (merged.area !== "all") params.set("area", merged.area);
    if (merged.status !== "all") params.set("status", merged.status);
    if (merged.q) params.set("q", merged.q);
    const parsed = readFilter(params, entries);
    filtersRef.current = parsed;
    setFilterState(parsed);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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
