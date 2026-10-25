import { Skeleton } from "./skeleton.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";
import { cn } from "./utils.js";

export interface DataTableSkeletonProps {
  label?: string;
  columns?: number;
  rows?: number;
  filter?: boolean;
  className?: string;
}

/**
 * Standalone loading shape of DataTable for Suspense fallbacks: filter
 * slot plus a headed table of skeleton rows. (DataTable's own inline
 * loading state stays untouched inside the table body.)
 */
export function DataTableSkeleton({
  label = "Loading",
  columns = 4,
  rows = 3,
  filter = true,
  className,
}: DataTableSkeletonProps) {
  return (
    <div role="status" aria-label={label} className={cn("space-y-4", className)}>
      {filter ? <Skeleton className="h-9 max-w-sm" /> : null}
      {/* Decorative shape only — the zone label above carries the meaning. */}
      <Table aria-hidden>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }, (_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-2/3" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row}>
              {Array.from({ length: columns }, (_, column) => (
                <TableCell key={column}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
