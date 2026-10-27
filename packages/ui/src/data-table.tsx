"use client";

import * as React from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type RowData,
  type SortDirection,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "./button.js";
import { Input } from "./input.js";
import { Skeleton } from "./skeleton.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";
import { cn } from "./utils.js";

const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableColumn<TData extends RowData, TValue extends CellData> = ColumnDef<
  typeof features,
  TData,
  TValue
>;

export function createDataTableColumns<TData extends RowData>() {
  return createColumnHelper<typeof features, TData>();
}

export interface DataTableProps<TData extends RowData> {
  // `any` mirrors upstream: TanStack's own helper.columns() returns
  // Array<ColumnDef<TFeatures, TData, any>> since TValue is invariant.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ReadonlyArray<DataTableColumn<TData, any>>;
  data: TData[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  filterPlaceholder?: string;
  pageSize?: number;
}

function SortIcon({ direction }: { direction: SortDirection | false }) {
  const className = "size-icon-sm opacity-60";
  if (direction === "asc") return <ArrowUp className={className} aria-hidden />;
  if (direction === "desc") return <ArrowDown className={className} aria-hidden />;
  return <ArrowUpDown className={className} aria-hidden />;
}

export interface DataTablePaginationProps {
  /** 1-based current page for display. */
  page: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export interface DataTableEmptyProps {
  colSpan: number;
  message?: React.ReactNode;
}

/**
 * Single centered row for the no-results state. `DataTable` renders
 * this when rows are empty; compose directly for custom table bodies.
 */
export function DataTableEmpty({ colSpan, message = "No results." }: DataTableEmptyProps) {
  return (
    <TableRow data-slot="data-table-empty">
      <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

/**
 * Page label plus previous/next controls. `DataTable` wires these to
 * the table state; compose directly for custom table chrome.
 */
export function DataTablePagination({
  page,
  pageCount,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  className,
}: DataTablePaginationProps) {
  return (
    <div data-slot="data-table-pagination" className={cn("flex items-center justify-end gap-data-table-pagination-gap", className)}>
      <span className="text-sm text-muted-foreground">
        Page {page} of {Math.max(pageCount, 1)}
      </span>
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={!canPrevious}>
        Previous
      </Button>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
        Next
      </Button>
    </div>
  );
}

export interface DataTableToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Global-filter input. `DataTable` wires it to the table state;
 * compose directly for custom table chrome.
 */
export function DataTableToolbar({ value, onChange, placeholder = "Filter…" }: DataTableToolbarProps) {
  return (
    <Input
      data-slot="data-table-toolbar"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="max-w-data-table-filter-width"
      aria-label={placeholder}
    />
  );
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = "No results.",
  filterPlaceholder = "Filter…",
  pageSize = 10,
}: DataTableProps<TData>) {
  const table = useTable({ features, columns, data });
  const rows = table.getRowModel().rows;
  const { pageIndex } = table.state.pagination;

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [table, pageSize]);

  return (
    <div data-slot="data-table" className="space-y-data-table-stack">
      <DataTableToolbar
        value={table.state.globalFilter ?? ""}
        onChange={(value) => {
          table.setGlobalFilter(value);
          table.setPageIndex(0);
        }}
        placeholder={filterPlaceholder}
      />
      <Table aria-busy={loading || undefined} aria-label={loading ? "Loading" : undefined}>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder || !header.column.getCanSort() ? (
                  <table.FlexRender header={header} />
                ) : (
                  <button
                    type="button"
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn("inline-flex min-h-(--zk-tap-min) items-center gap-data-table-sort-gap hover:text-foreground")}
                  >
                    <table.FlexRender header={header} />
                    <SortIcon direction={header.column.getIsSorted()} />
                  </button>
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {error !== null ? (
          <TableRow>
            <TableCell colSpan={columns.length} role="alert" className="text-destructive">
              {error}
            </TableCell>
          </TableRow>
        ) : loading ? (
          [0, 1, 2].map((row) => (
            <TableRow key={row}>
              {columns.map((_column, index) => (
                <TableCell key={index}>
                  <Skeleton className="h-data-table-skeleton-height w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length === 0 ? (
          <DataTableEmpty colSpan={columns.length} message={emptyMessage} />
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
      </Table>
      {rows.length > 0 && table.getPageCount() > 1 ? (
        <DataTablePagination
          page={pageIndex + 1}
          pageCount={table.getPageCount()}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onPrevious={() => table.previousPage()}
          onNext={() => table.nextPage()}
        />
      ) : null}
    </div>
  );
}
