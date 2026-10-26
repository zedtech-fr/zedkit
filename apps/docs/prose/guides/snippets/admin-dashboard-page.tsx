"use client";

import {
  AppShell,
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
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

export function AdminDashboardPage() {
  const columns = [
    columnHelper.accessor("name", { header: "Name" }),
    columnHelper.accessor("status", { header: "Status" }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: ItemRow; id: string } }) => (
        <Stack direction="horizontal" gap={2}>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">Edit</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm">Close</Button>
              </DrawerClose>
              <DrawerTitle>Edit {row.original.name}</DrawerTitle>
              <DrawerDescription>Update the display name. Focus returns here when you close the drawer.</DrawerDescription>
              <Field>
                <FieldLabel htmlFor={`name-${row.id}`}>Name</FieldLabel>
                <Input id={`name-${row.id}`} defaultValue={row.original.name} />
              </Field>
              <Button type="button">Save</Button>
            </DrawerContent>
          </Drawer>
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm">Delete</Button>}
            title={`Delete ${row.original.name}?`}
            description="This removes the row from the table in this demo."
            onConfirm={() => {}}
          />
        </Stack>
      ),
    }),
  ];

  return (
    <AppShell sidebar={<Text className="p-4 text-sm">Projects</Text>} topbar={<Text className="px-4 py-3 text-sm">Account</Text>}>
      <Stack gap={6} className="p-4 md:p-6">
        <PageHeader title="Items" description="Admin shell, sortable table, drawer form, and confirm dialog." />
        <DataTable columns={columns} data={seed} pageSize={10} />
      </Stack>
    </AppShell>
  );
}
