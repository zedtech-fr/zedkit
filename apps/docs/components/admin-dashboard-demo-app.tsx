"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmit,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  Toaster,
  createDataTableColumns,
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
export function AdminDashboardDemoApp() {
  const [apps, setApps] = useState<AdminAppRow[]>(seedApps);
  const [preview, setPreview] = useState<PreviewMode>("ready");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useValidatedForm<FormValues>(formSchema, {
    defaultValues: { name: "", region: "eu" },
  });

  function openCreate() {
    setEditingId(null);
    form.reset({ name: "", region: "eu" });
    setDrawerOpen(true);
  }

  function openEdit(row: AdminAppRow) {
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
  }

  function deleteApp(id: string) {
    setApps((prev) => prev.filter((row) => row.id !== id));
    toast.success("App removed");
  }

  const tableData = preview === "empty" ? [] : apps;
  const loading = preview === "loading";
  const error = preview === "error" ? "Could not load apps. Switch preview to Ready and try again." : null;

  const columns = [
    tableHelper.accessor("name", { header: "Name" }),
    tableHelper.accessor("region", { header: "Region" }),
    tableHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Stack direction="horizontal" gap={2} className="flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row.original)}>
            Edit
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive" size="sm">
                Delete
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
      <Stack
        className="max-h-[32rem] w-full min-w-0 overflow-auto rounded-lg border border-border"
        aria-label="Interactive admin dashboard demo"
      >
        {/* AppShell layout without landmarks: this island already sits inside the page main. */}
        <Stack direction="horizontal" className="min-h-svh w-full gap-0">
          <Stack className="hidden w-64 shrink-0 gap-0 border-r bg-muted/40 md:block">
            <Stack className="p-4" gap={2}>
              <Text className="text-sm font-semibold">Apps</Text>
              <Text variant="muted" className="text-sm">Demo nav</Text>
            </Stack>
          </Stack>
          <Stack className="min-w-0 flex-1 gap-0">
            <Stack className="sticky top-0 z-10 gap-0 border-b bg-background/95 backdrop-blur">
              <Stack direction="horizontal" gap={3} className="flex-wrap items-center justify-between p-4">
                <Text className="text-sm font-medium">Project apps</Text>
                <Stack direction="horizontal" gap={2} className="flex-wrap items-center">
                  <Stack direction="horizontal" gap={2} className="items-center">
                    <Text variant="muted" className="text-sm" id="demo-preview-label">
                      Table preview
                    </Text>
                    <Select value={preview} onValueChange={(value) => setPreview(value as PreviewMode)}>
                      <SelectTrigger className="w-[9.5rem]" aria-labelledby="demo-preview-label">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="loading">Loading</SelectItem>
                        <SelectItem value="empty">Empty</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </Stack>
                  <Button type="button" onClick={openCreate}>
                    Add app
                  </Button>
                </Stack>
              </Stack>
            </Stack>
            <Stack className="flex-1 gap-0 p-4 md:p-6">
              <Stack gap={4}>
                <PageHeader
                  title="Apps"
                  description="Add, edit, or delete rows. Switch the preview to see loading, empty, and error states."
                />
                <DataTable
                  columns={columns}
                  data={tableData}
                  loading={loading}
                  error={error}
                  emptyMessage="No apps yet. Choose Ready and click Add app."
                  pageSize={5}
                />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      <Drawer open={drawerOpen} onOpenChange={(open) => (open ? setDrawerOpen(true) : closeDrawer())} direction="right">
        <DrawerContent>
          <DrawerTitle>{editingId ? "Edit app" : "Add app"}</DrawerTitle>
          <DrawerDescription>Name and region are stored in local state only.</DrawerDescription>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Stack gap={4}>
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
                <Stack direction="horizontal" gap={2}>
                  <FormSubmit>{editingId ? "Save changes" : "Create app"}</FormSubmit>
                  <DrawerClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DrawerClose>
                </Stack>
              </Stack>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
