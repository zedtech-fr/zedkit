import type { ComponentType } from "react";
import { BadgeDemo } from "@/components/demos/badge-demo";
import { ButtonDemo } from "@/components/demos/button-demo";
import { ConfirmDialogDemo } from "@/components/demos/confirm-dialog-demo";
import { DrawerDemo } from "@/components/demos/drawer-demo";
import { HomeAdminDashboardDemo } from "@/components/demos/home-admin-dashboard-demo";
import { InputDemo } from "@/components/demos/input-demo";

/** Only the demos the home page renders — not the full docs registry. */
export const homeGalleryDemos: Record<string, ComponentType> = {
  BadgeDemo,
  ButtonDemo,
  ConfirmDialogDemo,
  DrawerDemo,
  InputDemo,
};

export { HomeAdminDashboardDemo };
