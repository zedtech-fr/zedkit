"use client";

import { Button, Checkbox, Input, Label, Stack, Text, cn } from "@zedtech/zedkit-ui";
import type { CatalogArea } from "@/content/catalog-index";
import { CATALOG_AREAS } from "@/lib/catalog-filter.mjs";
import { catalogCopy } from "@/ui/catalog/i18n/catalog-copy";

function CatalogSearchField({
  q,
  onFilters,
}: {
  q: string;
  onFilters: (next: { q?: string }) => void;
}) {
  return (
    <Stack gap="tight" className="content-shrink flex-1">
      <Label htmlFor="catalog-search">{catalogCopy.filters.searchLabel}</Label>
      <Input
        id="catalog-search"
        type="search"
        value={q}
        onChange={(event) => onFilters({ q: event.target.value })}
        placeholder={catalogCopy.filters.searchPlaceholder}
        data-catalog-filter-search=""
        className="shadow-none"
      />
    </Stack>
  );
}

function CatalogCategoryChips({
  area,
  countsByArea,
  onFilters,
}: {
  area: CatalogArea | "all";
  countsByArea: Record<(typeof CATALOG_AREAS)[number]["id"], number>;
  onFilters: (next: { area?: string }) => void;
}) {
  return (
    <Stack
      direction="horizontal"
      gap="sm"
      className="flex-wrap"
      role="group"
      aria-label={catalogCopy.filters.chipsAriaLabel}
    >
      {CATALOG_AREAS.map((row) => {
        const selected = area === row.id;
        return (
          <Button
            key={row.id}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            aria-pressed={selected}
            data-catalog-chip={row.id}
            data-site-action={selected ? "" : undefined}
            className={cn(
              "min-h-target rounded-full px-button-inline-sm shadow-none",
              selected ? undefined : "bg-background text-foreground hover:text-foreground",
            )}
            onClick={() => onFilters({ area: selected ? "all" : row.id })}
          >
            {catalogCopy.filters.chipLabel(row.label, countsByArea[row.id])}
          </Button>
        );
      })}
    </Stack>
  );
}

function CatalogStableOnly({
  status,
  onFilters,
}: {
  status: string;
  onFilters: (next: { status?: string }) => void;
}) {
  const checked = status === "stable";
  return (
    <Stack direction="horizontal" gap="sm" className="min-h-target items-center xl:ms-auto">
      <Checkbox
        id="catalog-stable-only"
        checked={checked}
        onCheckedChange={(value) => onFilters({ status: value === true ? "stable" : "all" })}
        aria-label={catalogCopy.filters.stableOnly}
      />
      <Label htmlFor="catalog-stable-only">{catalogCopy.filters.stableOnly}</Label>
    </Stack>
  );
}

export function CatalogFiltersToolbar({
  area,
  status,
  q,
  countsByArea,
  onFilters,
}: {
  area: CatalogArea | "all";
  status: string;
  q: string;
  countsByArea: Record<(typeof CATALOG_AREAS)[number]["id"], number>;
  onFilters: (next: { area?: string; status?: string; q?: string }) => void;
}) {
  return (
    <Stack gap="md" data-catalog-toolbar="" aria-label={catalogCopy.filters.toolbarAriaLabel}>
      <Stack gap="md" data-catalog-filter-row="">
        <CatalogSearchField q={q} onFilters={onFilters} />
      </Stack>
      <Stack direction="horizontal" gap="sm" className="flex-wrap items-center">
        <CatalogCategoryChips area={area} countsByArea={countsByArea} onFilters={onFilters} />
        <CatalogStableOnly status={status} onFilters={onFilters} />
      </Stack>
    </Stack>
  );
}

export function catalogResultsStatusLine(shown: number, total: number) {
  return (
    <Text as="span" variant="muted" role="status" aria-live="polite">
      {`${catalogCopy.results.statusLine(shown, total)} ${catalogCopy.results.stableLegend}`}
    </Text>
  );
}
