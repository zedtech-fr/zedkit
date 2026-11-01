"use client";

import {
  Button,
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
  FormSubmit,
} from "@zedtech/zedkit-ui";

import { AdminDashboardDemoDrawerFields } from "./admin-dashboard-demo-drawer-fields";
import type { AdminDashboardFormControl } from "./admin-dashboard-demo-form";
import { type AdminDashboardFormValues } from "./admin-dashboard-demo-types";

export function AdminDashboardDemoDrawer({
  open,
  editingId,
  form,
  onOpenChange,
  onCloseAutoFocus,
  onAnimationEnd,
  onSubmit,
}: {
  open: boolean;
  editingId: string | null;
  form: AdminDashboardFormControl;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
  onAnimationEnd: (open: boolean) => void;
  onSubmit: (values: AdminDashboardFormValues) => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onAnimationEnd={onAnimationEnd}
      direction="right"
    >
      <DrawerContent onCloseAutoFocus={onCloseAutoFocus}>
        <DrawerHandle />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle>{editingId ? "Edit app" : "Add app"}</DrawerTitle>
              <DrawerDescription>Name and region are stored in local state only.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <AdminDashboardDemoDrawerFields form={form} />
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
  );
}
