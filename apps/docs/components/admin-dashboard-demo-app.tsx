"use client";

import { useRef, useState } from "react";

import { DOCS_TYPE_BODY_CLASS, DOCS_TYPE_H3_CLASS, DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import {
  Button,
  DataTable,
  DetailPanel,
  Heading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
  Toaster,
  toast,
} from "@zedtech/zedkit-ui";

import { buildAdminDashboardColumns } from "./admin-dashboard-demo-columns";
import {
  AdminDashboardDemoDrawer,
} from "./admin-dashboard-demo-drawer";
import { useAdminDashboardForm } from "./admin-dashboard-demo-form";
import {
  adminDashboardSeedApps,
  type AdminAppRow,
  type AdminDashboardFormValues,
  type PreviewMode,
} from "./admin-dashboard-demo-types";

export type { PreviewMode } from "./admin-dashboard-demo-types";

/**
 * Shared interactive admin dashboard (home demo + future tutorial).
 * Local state only; preview modes exercise DataTable loading/empty/error.
 */
export function AdminDashboardDemoApp({
  label = "Interactive admin dashboard demo",
  preview: previewProp,
  onPreviewChange,
  variant = "default",
}: {
  label?: string;
  preview?: PreviewMode;
  onPreviewChange?: (mode: PreviewMode) => void;
  variant?: "default" | "home";
}) {
  const isHome = variant === "home";
  const [apps, setApps] = useState<AdminAppRow[]>(adminDashboardSeedApps);
  const [previewInternal, setPreviewInternal] = useState<PreviewMode>("ready");
  const preview = previewProp ?? previewInternal;
  const setPreview = (mode: PreviewMode) => {
    onPreviewChange?.(mode);
    if (previewProp === undefined) setPreviewInternal(mode);
  };
  const [selectedId, setSelectedId] = useState<string | null>(adminDashboardSeedApps[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const form = useAdminDashboardForm();

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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        find()?.focus({ preventScroll: true });
      });
    });
  }

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

  function onSubmit(values: AdminDashboardFormValues) {
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

  const columns = buildAdminDashboardColumns({
    selectedId,
    onSelect: setSelectedId,
    onEdit: openEdit,
    onDelete: deleteApp,
  });

  const toolbarPad = isHome ? "p-3" : "p-4";
  const bodyPad = isHome ? "p-3 pt-0" : "p-4";

  return (
    <>
      <Toaster />
      <Stack className="w-full min-w-0" aria-label={label} data-admin-dashboard-demo={isHome ? "home" : undefined}>
        <Stack gap={isHome ? 2 : 3} className={`border-b border-border ${toolbarPad}`} data-demo-toolbar>
          <Heading level={2} className={`${DOCS_TYPE_H3_CLASS} tracking-tight`}>
            Project apps
          </Heading>
          {isHome ? (
            <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
              Select a row, then add, edit, or delete.
            </Text>
          ) : (
            <Text variant="muted" className={DOCS_TYPE_BODY_CLASS}>
              Select a row for details. Add, edit, or delete apps; switch preview for loading, empty, and error.
            </Text>
          )}
          <Stack direction="horizontal" gap={2} className="flex-nowrap items-center">
            {!isHome ? (
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
            ) : null}
            <Button type="button" className="shrink-0" onClick={openCreate}>
              Add app
            </Button>
          </Stack>
        </Stack>
        <Stack gap={isHome ? 2 : 4} className={`min-w-0 ${bodyPad}`}>
          <DataTable
            columns={columns}
            data={tableData}
            loading={loading}
            error={error}
            emptyMessage="No apps yet. Choose Ready and click Add app."
            pageSize={5}
          />
          {!isHome && preview === "ready" && !loading && !error ? (
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

      <AdminDashboardDemoDrawer
        open={drawerOpen}
        editingId={editingId}
        form={form}
        onOpenChange={(open) => (open ? setDrawerOpen(true) : closeDrawer())}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreOpener();
        }}
        onAnimationEnd={(open) => {
          if (!open) restoreOpener();
        }}
        onSubmit={onSubmit}
      />
    </>
  );
}
