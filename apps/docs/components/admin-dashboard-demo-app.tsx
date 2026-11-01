"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

import { DOCS_TYPE_BODY_CLASS, DOCS_TYPE_H3_CLASS, DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import {
  Button,
  ConfirmDialog,
  DataTable,
  DetailPanel,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmit,
  Heading,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  Toaster,
  createDataTableColumns,
  toast,
  useValidatedForm,
} from "@zedtech/zedkit-ui";

export type AdminAppRow = { id: string; name: string; region: "eu" | "us" };

const tableHelper = createDataTableColumns<AdminAppRow>();

const formSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters."),
  region: z.enum(["eu", "us"]),
});

type FormValues = z.infer<typeof formSchema>;

type PreviewMode = "ready" | "loading" | "empty" | "error";

const seedApps: AdminAppRow[] = [
  { id: "seed-console", name: "console", region: "eu" },
  { id: "seed-worker", name: "worker", region: "us" },
];

/**
 * Shared interactive admin dashboard (home demo + future tutorial).
 * Local state only; preview modes exercise DataTable loading/empty/error.
 */
export function AdminDashboardDemoApp({
  label = "Interactive admin dashboard demo",
}: {
  label?: string;
}) {
  const [apps, setApps] = useState<AdminAppRow[]>(seedApps);
  const [preview, setPreview] = useState<PreviewMode>("ready");
  const [selectedId, setSelectedId] = useState<string | null>(seedApps[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const selectedApp = selectedId ? apps.find((row) => row.id === selectedId) : undefined;

  function rememberOpener() {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;
  }

  function restoreOpener() {
    const remembered = openerRef.current;
    const aria = remembered?.getAttribute("aria-label");
    const text = remembered?.textContent?.trim() ?? "";
    const find = () => {
      if (remembered && document.contains(remembered)) return remembered;
      const scope = document.querySelector(`[aria-label="${CSS.escape(label)}"]`);
      if (!scope) return null;
      if (aria) return scope.querySelector<HTMLElement>(`button[aria-label="${CSS.escape(aria)}"]`);
      return text
        ? ([...scope.querySelectorAll("button")].find((el) => el.textContent?.trim() === text) ?? null)
        : null;
    };
    // Table cells remount when the drawer state updates, so wait a frame then re-query.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        find()?.focus({ preventScroll: true });
      });
    });
  }

  const form = useValidatedForm(formSchema, {
    defaultValues: { name: "", region: "eu" },
  });

  function openCreate() {
    rememberOpener();
    setEditingId(null);
    form.reset({ name: "", region: "eu" });
    setDrawerOpen(true);
  }

  function openEdit(row: AdminAppRow) {
    rememberOpener();
    setEditingId(row.id);
    form.reset({ name: row.name, region: row.region });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  function onSubmit(values: FormValues) {
    if (editingId) {
      setApps((prev) => prev.map((row) => (row.id === editingId ? { ...row, ...values } : row)));
      toast.success("App updated");
    } else {
      setApps((prev) => [...prev, { id: `app-${Date.now()}`, ...values }]);
      toast.success("App added");
    }
    closeDrawer();
    restoreOpener();
  }

  function deleteApp(id: string) {
    setApps((prev) => prev.filter((row) => row.id !== id));
    setSelectedId((current) => (current === id ? null : current));
    toast.success("App removed");
  }

  const tableData = preview === "empty" ? [] : apps;
  const loading = preview === "loading";
  const error = preview === "error" ? "Could not load apps. Switch preview to Ready and try again." : null;

  const columns = [
    tableHelper.accessor("name", {
      header: "Name",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-h-11 w-full justify-start px-2 font-normal"
          aria-pressed={selectedId === row.original.id}
          onClick={() => setSelectedId(row.original.id)}
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
            onClick={() => openEdit(row.original)}
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
            onConfirm={() => deleteApp(row.original.id)}
          />
        </Stack>
      ),
    }),
  ];

  return (
    <>
      <Toaster />
      <Stack className="w-full min-w-0" aria-label={label}>
        <Stack gap={3} className="border-b border-border p-4" data-demo-toolbar>
          <Heading level={2} className={`${DOCS_TYPE_H3_CLASS} tracking-tight`}>
            Project apps
          </Heading>
          <Text variant="muted" className={DOCS_TYPE_BODY_CLASS}>
            Select a row for details. Add, edit, or delete apps; switch preview for loading, empty, and error.
          </Text>
          <Stack direction="horizontal" gap={2} className="flex-nowrap items-center">
            <Select value={preview} onValueChange={(value) => setPreview(value as PreviewMode)}>
              <SelectTrigger className="min-w-0 flex-1" aria-label="Table preview mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="loading">Loading</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" className="shrink-0" onClick={openCreate}>
              Add app
            </Button>
          </Stack>
        </Stack>
        <Stack gap={4} className="min-w-0 p-4">
          <DataTable
            columns={columns}
            data={tableData}
            loading={loading}
            error={error}
            emptyMessage="No apps yet. Choose Ready and click Add app."
            pageSize={5}
          />
          {preview === "ready" && !loading && !error ? (
            selectedApp ? (
              <DetailPanel
                className="min-w-0"
                items={[
                  { label: "Name", value: selectedApp.name },
                  { label: "Region", value: selectedApp.region },
                  { label: "ID", value: selectedApp.id },
                ]}
              />
            ) : (
              <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
                Select an app row to see its details.
              </Text>
            )
          ) : null}
        </Stack>
      </Stack>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => (open ? setDrawerOpen(true) : closeDrawer())}
        onAnimationEnd={(open) => {
          if (!open) restoreOpener();
        }}
        direction="right"
      >
        <DrawerContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreOpener();
          }}
        >
          <DrawerHandle />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
              <DrawerHeader>
                <DrawerTitle>{editingId ? "Edit app" : "Add app"}</DrawerTitle>
                <DrawerDescription>Name and region are stored in local state only.</DrawerDescription>
              </DrawerHeader>
              <DrawerBody>
                <Stack gap={4} className="py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pick a region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="eu">eu</SelectItem>
                            <SelectItem value="us">us</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Stack>
              </DrawerBody>
              <DrawerFooter>
                <FormSubmit>{editingId ? "Save changes" : "Create app"}</FormSubmit>
                <DrawerClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
