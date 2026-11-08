"use client";

import { FolderKanban, Server, Settings } from "lucide-react";
import { useState } from "react";
import {
  AppShell,
  Badge,
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
  cn,
  createDataTableColumns,
} from "@zedtech/zedkit-ui";
import { adminDashboardGuideCopy } from "@/components/demos/i18n/admin-dashboard-guide-copy";
import { usePreviewMobile } from "@/components/preview-viewport";

interface ItemRow {
  name: string;
  status: string;
}

const columnHelper = createDataTableColumns<ItemRow>();

const seed: ItemRow[] = [...adminDashboardGuideCopy.seed];

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
          {adminDashboardGuideCopy.edit}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>{adminDashboardGuideCopy.editTitle(item.name)}</DrawerTitle>
          <DrawerDescription>{adminDashboardGuideCopy.editDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Field>
            <FieldLabel htmlFor={`name-${item.name}`}>{adminDashboardGuideCopy.nameLabel}</FieldLabel>
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
            {adminDashboardGuideCopy.save}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              {adminDashboardGuideCopy.close}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Sidebar() {
  return (
    <Stack gap="lg" className="h-full surface-pad-compact">
      <Stack gap="tight">
        <Text className="font-semibold">{adminDashboardGuideCopy.brand}</Text>
        <Text variant="muted" className="text-caption">
          {adminDashboardGuideCopy.product}
        </Text>
      </Stack>
      <nav aria-label={adminDashboardGuideCopy.navAria}>
        <Stack gap="tight">
          <Button type="button" variant="secondary" className="w-full justify-start gap-stack-sm" aria-current="page">
            <FolderKanban className="size-icon" aria-hidden />
            {adminDashboardGuideCopy.nav.projects}
          </Button>
          <Button type="button" variant="ghost" className="w-full justify-start gap-stack-sm">
            <Server className="size-icon" aria-hidden />
            {adminDashboardGuideCopy.nav.services}
          </Button>
          <Button type="button" variant="ghost" className="w-full justify-start gap-stack-sm">
            <Settings className="size-icon" aria-hidden />
            {adminDashboardGuideCopy.nav.settings}
          </Button>
        </Stack>
      </nav>
    </Stack>
  );
}

function TopBar() {
  return (
    <Stack direction="horizontal" gap="sm" className="justify-end surface-pad-inline surface-pad-block-sm">
      <Text
        as="span"
        aria-hidden="true"
        className="flex size-person shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground"
      >
        {adminDashboardGuideCopy.initials}
      </Text>
      <Text as="span" className="text-dense font-medium">
        {adminDashboardGuideCopy.user}
      </Text>
    </Stack>
  );
}

export function AdminDashboardGuideDemo() {
  const mobile = usePreviewMobile();
  const [rows, setRows] = useState<ItemRow[]>(() => [...seed]);

  const columns = [
    columnHelper.accessor("name", { header: adminDashboardGuideCopy.columns.name }),
    columnHelper.accessor("status", {
      header: adminDashboardGuideCopy.columns.status,
      cell: ({ getValue }) => (
        <Badge variant={getValue() === "active" ? "success" : "warning"}>{getValue()}</Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: adminDashboardGuideCopy.columns.actions,
      cell: ({ row }: { row: { original: ItemRow; id: string } }) => (
        <Stack direction="horizontal" gap="sm">
          <EditItemDrawer
            item={row.original}
            onSave={(next) => {
              setRows((current) => current.map((entry) => (entry.name === row.original.name ? next : entry)));
            }}
          />
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm">{adminDashboardGuideCopy.delete}</Button>}
            title={adminDashboardGuideCopy.deleteTitle(row.original.name)}
            description={adminDashboardGuideCopy.deleteDescription}
            onConfirm={() => {
              setRows((current) => current.filter((entry) => entry.name !== row.original.name));
            }}
          />
        </Stack>
      ),
    }),
  ];

  return (
    <Stack data-demo-frame="" className="content-shrink overflow-hidden rounded-lg border border-border bg-background">
      <AppShell
        className={cn("h-full pane-shrink [&>aside]:w-sidebar-compact", mobile && "[&>aside]:hidden")}
        sidebar={<Sidebar />}
        topbar={<TopBar />}
      >
        <PageHeader
          titleAs="h2"
          title={adminDashboardGuideCopy.pageTitle}
          description={adminDashboardGuideCopy.pageDescription}
        />
        <DataTable columns={columns} data={rows} pageSize={6} />
      </AppShell>
    </Stack>
  );
}
