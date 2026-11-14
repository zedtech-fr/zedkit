"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Heading, Section, Stack, Text } from "@zedtech/zedkit-ui";
import type { CatalogArea, CatalogIndexEntry } from "@/content/catalog-index";
import {
  CATALOG_DEFAULT_FILTERS,
  catalogFilterSearchParams,
  catalogFilterView,
  readCatalogFilters,
} from "./catalog-filter.mjs";

import { CatalogCounters } from "./catalog-counters";
import { CatalogFiltersToolbar, CatalogResultsStatus } from "./catalog-filters";
import { catalogCopy } from "./i18n/catalog-copy";

const CatalogResultsBodyLazy = dynamic(
  () => import("./catalog-results").then((mod) => ({ default: mod.CatalogResultsBody })),
  {
    loading: () => (
      <Stack gap="lg" data-catalog-results-root="">
        <Text variant="muted" role="status">
          {catalogCopy.header.loadingResults}
        </Text>
      </Stack>
    ),
  },
);

function readFilter(
  searchParams: URLSearchParams,
  entries: CatalogIndexEntry[],
): { area: CatalogArea | "all"; status: string; q: string } {
  const parsed = readCatalogFilters(searchParams);
  const statuses = new Set(entries.map((entry) => entry.status));
  const status = parsed.status === "all" || statuses.has(parsed.status) ? parsed.status : "all";
  return { area: parsed.area, status, q: parsed.q };
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
  const { countsByArea, visible, total } = useMemo(
    () => catalogFilterView(entries, { area, status, q }),
    [entries, area, status, q],
  );

  function setFilters(next: { area?: string; status?: string; q?: string }) {
    onFilters?.(next);
  }

  return (
    <>
      <Section
        bleed
        tone="muted"
        spacing="sm"
        containerWidth="default"
        data-catalog-header-band=""
      >
        <Stack data-catalog-intro="">
          <Stack gap="sm">
            <Heading level={1}>{catalogCopy.header.title}</Heading>
            <Text variant="muted" typeRole="lead" className="text-muted-foreground">
              {catalogCopy.header.lead(entries.length)}
            </Text>
          </Stack>
          <CatalogCounters counts={countsByArea} />
        </Stack>
      </Section>
      <Section bleed spacing="sm" containerWidth="default">
        <CatalogFiltersToolbar
          area={area}
          status={status}
          q={q}
          countsByArea={countsByArea}
          onFilters={setFilters}
        />
      </Section>
      <Container width="wide" className="pt-start pb-section-lg">
        <Stack gap="md">
          <CatalogResultsBodyLazy filtered={visible} />
          <Stack data-catalog-results-heading="">
            <CatalogResultsStatus shown={visible.length} total={total} />
          </Stack>
        </Stack>
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
  const qDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next = readFilter(new URLSearchParams(searchParams.toString()), entries);
    // A URL echo of an earlier query must not eat letters still being typed.
    if (qDebounceRef.current) next.q = filtersRef.current.q;
    filtersRef.current = next;
    setFilterState(next);
  }, [entries, searchParams]);

  function pushFilterUrl(parsed: ReturnType<typeof readFilter>) {
    const query = catalogFilterSearchParams(parsed).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function setFilters(next: { area?: string; status?: string; q?: string }) {
    const merged = { ...filtersRef.current, ...next };
    const params = catalogFilterSearchParams(merged);
    const parsed = readFilter(params, entries);
    filtersRef.current = parsed;
    setFilterState(parsed);

    if (next.q !== undefined) {
      if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
      const timer = setTimeout(() => {
        if (qDebounceRef.current !== timer) return;
        qDebounceRef.current = null;
        pushFilterUrl(filtersRef.current);
      }, 120);
      qDebounceRef.current = timer;
      return;
    }
    if (qDebounceRef.current) {
      clearTimeout(qDebounceRef.current);
      qDebounceRef.current = null;
    }
    pushFilterUrl(parsed);
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
