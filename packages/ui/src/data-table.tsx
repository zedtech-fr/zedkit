import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type RowData,
  type SortDirection,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Skeleton } from "./skeleton.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";
import { cn } from "./utils.js";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
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
}

function SortIcon({ direction }: { direction: SortDirection | false }) {
  const className = "size-3.5 opacity-60";
  if (direction === "asc") return <ArrowUp className={className} aria-hidden />;
  if (direction === "desc") return <ArrowDown className={className} aria-hidden />;
  return <ArrowUpDown className={className} aria-hidden />;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = "No results.",
}: DataTableProps<TData>) {
  const table = useTable({ features, columns, data });
  const rows = table.getRowModel().rows;

  return (
    <Table>
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
                    className={cn("inline-flex items-center gap-1 hover:text-foreground")}
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
                  <Skeleton className="h-4 w-full" aria-label="Loading" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
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
  );
}
