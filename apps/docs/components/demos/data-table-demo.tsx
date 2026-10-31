"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  Stack,
  Text,
  createDataTableColumns,
  type BadgeProps,
} from "@zedtech/zedkit-ui";

interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: "Paid" | "Shipped" | "Pending" | "Refunded";
}

const STATUS_VARIANT: Record<Order["status"], BadgeProps["variant"]> = {
  Paid: "success",
  Shipped: "secondary",
  Pending: "warning",
  Refunded: "outline",
};

const orders: Order[] = [
  { id: "#1042", customer: "Camille Rousseau", date: "2026-10-26", total: 128.5, status: "Paid" },
  { id: "#1041", customer: "Noah Bernard", date: "2026-10-26", total: 54.9, status: "Pending" },
  { id: "#1040", customer: "Inès Moreau", date: "2026-10-25", total: 239, status: "Shipped" },
  { id: "#1039", customer: "Lucas Petit", date: "2026-10-25", total: 18.2, status: "Paid" },
  { id: "#1038", customer: "Sofia Garcia", date: "2026-10-24", total: 76.4, status: "Refunded" },
  { id: "#1037", customer: "Hugo Lambert", date: "2026-10-24", total: 312.75, status: "Shipped" },
  { id: "#1036", customer: "Léa Fontaine", date: "2026-10-23", total: 42, status: "Paid" },
  { id: "#1035", customer: "Adam Mercier", date: "2026-10-23", total: 99.99, status: "Pending" },
  { id: "#1034", customer: "Chloé Girard", date: "2026-10-22", total: 150.3, status: "Paid" },
  { id: "#1033", customer: "Jules Faure", date: "2026-10-21", total: 27.6, status: "Shipped" },
  { id: "#1032", customer: "Manon Roux", date: "2026-10-21", total: 83, status: "Paid" },
  { id: "#1031", customer: "Tom Lefèvre", date: "2026-10-20", total: 64.25, status: "Refunded" },
];

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const helper = createDataTableColumns<Order>();
const columns = [
  helper.accessor("id", { header: "Order" }),
  helper.accessor("customer", { header: "Customer" }),
  helper.accessor("date", {
    header: "Date",
    cell: ({ getValue }) => day.format(new Date(`${getValue()}T00:00:00Z`)),
  }),
  helper.accessor("total", { header: "Total", cell: ({ getValue }) => money.format(getValue()) }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <Badge variant={STATUS_VARIANT[getValue()]}>{getValue()}</Badge>,
  }),
];

const VIEWS = ["Orders", "Loading", "Error", "Empty"] as const;
type View = (typeof VIEWS)[number];

/** Store admin: filter, sort by a column header, page through 12 orders; switch the view to see each state. */
export function DataTableDemo() {
  const [view, setView] = useState<View>("Orders");
  return (
    <Stack gap={4}>
      <Stack direction="horizontal" gap={2} role="group" aria-label="Table state">
        {VIEWS.map((name) => (
          <Button
            key={name}
            size="sm"
            variant={view === name ? "default" : "outline"}
            aria-pressed={view === name}
            onClick={() => setView(name)}
          >
            {name}
          </Button>
        ))}
      </Stack>
      <Text variant="muted">Click a column header to sort. Type in the filter to search every column.</Text>
      <DataTable
        columns={columns}
        data={view === "Empty" ? [] : orders}
        loading={view === "Loading"}
        error={view === "Error" ? "Could not load orders. Check your connection and try again." : null}
        emptyMessage="No orders yet. New orders appear here as soon as they are paid."
        emptyAction={
          view === "Empty" ? (
            <Button size="sm" type="button">
              Create your first order
            </Button>
          ) : undefined
        }
        filterPlaceholder="Filter orders"
        pageSize={5}
      />
    </Stack>
  );
}
