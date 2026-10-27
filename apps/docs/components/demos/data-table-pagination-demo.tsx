"use client";

import { useState } from "react";
import {
  DataTablePagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zedtech/zedkit-ui";

const PAGE_SIZE = 5;
const catalog = [
  ["Linen shirt", 49], ["Canvas tote", 24], ["Ceramic mug", 14], ["Wool scarf", 39], ["Leather belt", 58],
  ["Cotton socks", 9], ["Denim jacket", 120], ["Rain cape", 65], ["Beach towel", 22], ["Straw hat", 28],
  ["Silk tie", 45], ["Trail cap", 19], ["Gym bag", 54], ["Notebook set", 12], ["Desk lamp", 72],
  ["Water bottle", 17], ["Wool socks", 13], ["Picnic blanket", 36], ["Bike bell", 8], ["Tea towel", 7],
] as const;

/** Server-style paging: you own the page number and ask your API for each page. */
export function DataTablePaginationDemo() {
  const [page, setPage] = useState(2);
  const pageCount = Math.ceil(catalog.length / PAGE_SIZE);
  const rows = catalog.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <Stack gap={4}>
      <Table aria-label="Products">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([name, price]) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
              <TableCell>{price} €</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DataTablePagination
        page={page}
        pageCount={pageCount}
        canPrevious={page > 1}
        canNext={page < pageCount}
        onPrevious={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </Stack>
  );
}
