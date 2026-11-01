"use client";

import { useState } from "react";
import {
  AppShell,
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  FieldLabel,
  Input,
  PageHeader,
  Stack,
  Text,
  createDataTableColumns,
} from "@zedtech/zedkit-ui";

interface ItemRow {
  name: string;
  status: string;
}

const columnHelper = createDataTableColumns<ItemRow>();

const seed: ItemRow[] = [
  { name: "reports-api", status: "active" },
  { name: "billing-worker", status: "paused" },
];

function EditItemDrawer({
  item,
  onSave,
}: {
  item: ItemRow;
  onSave: (next: ItemRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setName(item.name);
      }}
    >
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>Edit {item.name}</DrawerTitle>
          <DrawerDescription>Update the display name. Focus returns here when you close the drawer.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Field>
            <FieldLabel htmlFor={`name-${item.name}`}>Name</FieldLabel>
            <Input
              id={`name-${item.name}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            onClick={() => {
              onSave({ ...item, name: name.trim() || item.name });
              setOpen(false);
            }}
          >
            Save
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function AdminDashboardGuideDemo() {
  const [rows, setRows] = useState<ItemRow[]>(() => [...seed]);

  const columns = [
    columnHelper.accessor("name", { header: "Name" }),
    columnHelper.accessor("status", { header: "Status" }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: ItemRow; id: string } }) => (
        <Stack direction="horizontal" gap={2}>
          <EditItemDrawer
            item={row.original}
            onSave={(next) => {
              setRows((current) => current.map((entry) => (entry.name === row.original.name ? next : entry)));
            }}
          />
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm">Delete</Button>}
            title={`Delete ${row.original.name}?`}
            description="This removes the row from the table in this demo."
            onConfirm={() => {
              setRows((current) => current.filter((entry) => entry.name !== row.original.name));
            }}
          />
        </Stack>
      ),
    }),
  ];

  return (
    <AppShell
      className="max-h-[min(32rem,70vh)] min-h-0 overflow-auto rounded-lg border"
      sidebar={<Text className="p-4 text-sm">Projects</Text>}
      topbar={<Text className="px-4 py-3 text-sm">Account</Text>}
    >
      <Stack gap={6} className="p-4 md:p-6">
        <PageHeader title="Items" description="Admin shell, sortable table, drawer form, and confirm dialog." />
        <DataTable columns={columns} data={rows} pageSize={10} />
      </Stack>
    </AppShell>
  );
}
