"use client";

import { Pencil, Trash2 } from "lucide-react";

import {
  Button,
  ConfirmDialog,
  Stack,
  createDataTableColumns,
} from "@zedtech/zedkit-ui";

import type { AdminAppRow } from "./admin-dashboard-demo-types";

const tableHelper = createDataTableColumns<AdminAppRow>();

export function buildAdminDashboardColumns({
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (row: AdminAppRow) => void;
  onDelete: (id: string) => void;
}) {
  return [
    tableHelper.accessor("name", {
      header: "Name",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-11 w-full justify-start px-2 font-normal"
          aria-pressed={selectedId === row.original.id}
          onClick={() => onSelect(row.original.id)}
        >
          {row.original.name}
        </Button>
      ),
    }),
    tableHelper.accessor("region", { header: "Region" }),
    tableHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Stack direction="horizontal" gap={1} className="flex-nowrap justify-end" data-demo-row-actions>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Edit ${row.original.name}`}
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive" size="icon" aria-label={`Delete ${row.original.name}`}>
                <Trash2 className="size-4" aria-hidden />
              </Button>
            }
            title="Delete app?"
            description={`Remove “${row.original.name}” from the list.`}
            confirmLabel="Delete"
            onConfirm={() => onDelete(row.original.id)}
          />
        </Stack>
      ),
    }),
  ];
}
