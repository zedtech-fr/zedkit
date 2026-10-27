"use client";

import { useState } from "react";
import {
  DataTableEmpty,
  DataTableToolbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@zedtech/zedkit-ui";

const customers = [
  { name: "Camille Rousseau", city: "Lyon", orders: 14 },
  { name: "Noah Bernard", city: "Nantes", orders: 3 },
  { name: "Inès Moreau", city: "Lille", orders: 9 },
  { name: "Lucas Petit", city: "Lyon", orders: 1 },
  { name: "Sofia Garcia", city: "Marseille", orders: 22 },
  { name: "Hugo Lambert", city: "Nantes", orders: 6 },
];

/** The filter box on its own: you decide what it filters (here, name or city). */
export function DataTableToolbarDemo() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const rows = customers.filter((c) => `${c.name} ${c.city}`.toLowerCase().includes(needle));
  return (
    <Stack gap={3}>
      <DataTableToolbar value={query} onChange={setQuery} placeholder="Search customers" />
      <Text variant="muted" aria-live="polite">
        {rows.length} of {customers.length} customers
      </Text>
      <Table aria-label="Customers">
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Orders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <DataTableEmpty colSpan={3} message="No customer matches your search." />
          ) : (
            rows.map((c) => (
              <TableRow key={c.name}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.city}</TableCell>
                <TableCell>{c.orders}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}
