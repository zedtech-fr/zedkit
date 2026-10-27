import type { ComponentType } from "react";
import { AlertDemo } from "./alert-demo";
import { AppShellDemo } from "./app-shell-demo";
import { BadgeDemo } from "./badge-demo";
import { BrandLogoDemo, BrandLogoHeaderDemo } from "./brand-logo-demo";
import { ButtonDemo } from "./button-demo";
import { CardDemo } from "./card-demo";
import { CardFooterDemo } from "./card-footer-demo";
import { CheckmarkDemo } from "./checkmark-demo";
import { ConfirmDialogDemo } from "./confirm-dialog-demo";
import { DataTableDemo } from "./data-table-demo";
import { DataTableEmptyDemo } from "./data-table-empty-demo";
import { DataTablePaginationDemo } from "./data-table-pagination-demo";
import { DataTableToolbarDemo } from "./data-table-toolbar-demo";
import { DetailsComposedDemo } from "./details-composed-demo";
import { DetailsDemo } from "./details-demo";
import { DialogDemo } from "./dialog-demo";
import { DrawerDemo } from "./drawer-demo";
import { FieldDemo } from "./field-demo";
import { HomeAdminDashboardDemo } from "./home-admin-dashboard-demo";
import { ProgressBarDemo } from "./progress-bar-demo";
import { RouteModalDemo } from "./route-modal-demo";
import { InputDemo } from "./input-demo";
import { LabelDemo } from "./label-demo";
import { LoadingZonesDemo } from "./loading-zones-demo";
import { MotionDemo } from "./motion-demo";
import { SecretFieldDemo } from "./secret-field-demo";
import { SelectDemo } from "./select-demo";
import { SeparatorDemo } from "./separator-demo";
import { SkeletonDemo } from "./skeleton-demo";
import { StackDemo } from "./stack-demo";
import { StatusDotDemo } from "./status-dot-demo";
import { StatusLabelDemo } from "./status-label-demo";
import { TabsControlledDemo } from "./tabs-controlled-demo";
import { TabsDemo } from "./tabs-demo";
import { TextareaDemo } from "./textarea-demo";
import { ToasterDemo } from "./toaster-demo";
import { ToggleDemo } from "./toggle-demo";
import { ValidatedFormDemo } from "./validated-form-demo";
import { TypographyDemo } from "./typography-demo";
import { UpdatedAgoDemo } from "./updated-ago-demo";
import { WizardDemo } from "./wizard-demo";

/**
 * Single seam between doc pages and live demos. Pages and MDX never
 * import a demo file directly: they use a registry key (`ButtonDemo`),
 * and the docs check fails if a manifest key stops existing here or a
 * demo file stops exporting its demo.
 */
export interface DemoEntry {
  Demo: ComponentType;
  file: string;
  /** Narrow widget demos center in the preview viewport; panels fill. */
  center?: boolean;
}

export const demoRegistry = {
  AlertDemo: { Demo: AlertDemo, file: "alert-demo.tsx" },
  AppShellDemo: { Demo: AppShellDemo, file: "app-shell-demo.tsx" },
  BadgeDemo: { Demo: BadgeDemo, file: "badge-demo.tsx", center: true },
  ButtonDemo: { Demo: ButtonDemo, file: "button-demo.tsx", center: true },
  CardDemo: { Demo: CardDemo, file: "card-demo.tsx" },
  CardFooterDemo: { Demo: CardFooterDemo, file: "card-footer-demo.tsx" },
  CheckmarkDemo: { Demo: CheckmarkDemo, file: "checkmark-demo.tsx" },
  ConfirmDialogDemo: { Demo: ConfirmDialogDemo, file: "confirm-dialog-demo.tsx", center: true },
  BrandLogoDemo: { Demo: BrandLogoDemo, file: "brand-logo-demo.tsx" },
  BrandLogoHeaderDemo: { Demo: BrandLogoHeaderDemo, file: "brand-logo-demo.tsx" },
  DataTableDemo: { Demo: DataTableDemo, file: "data-table-demo.tsx" },
  DataTablePaginationDemo: { Demo: DataTablePaginationDemo, file: "data-table-pagination-demo.tsx" },
  DataTableEmptyDemo: { Demo: DataTableEmptyDemo, file: "data-table-empty-demo.tsx" },
  DataTableToolbarDemo: { Demo: DataTableToolbarDemo, file: "data-table-toolbar-demo.tsx" },
  DetailsDemo: { Demo: DetailsDemo, file: "details-demo.tsx" },
  DetailsComposedDemo: { Demo: DetailsComposedDemo, file: "details-composed-demo.tsx" },
  DialogDemo: { Demo: DialogDemo, file: "dialog-demo.tsx", center: true },
  DrawerDemo: { Demo: DrawerDemo, file: "drawer-demo.tsx", center: true },
  FieldDemo: { Demo: FieldDemo, file: "field-demo.tsx" },
  HomeAdminDashboardDemo: { Demo: HomeAdminDashboardDemo, file: "home-admin-dashboard-demo.tsx" },
  InputDemo: { Demo: InputDemo, file: "input-demo.tsx" },
  LabelDemo: { Demo: LabelDemo, file: "label-demo.tsx" },
  LoadingZonesDemo: { Demo: LoadingZonesDemo, file: "loading-zones-demo.tsx" },
  MotionDemo: { Demo: MotionDemo, file: "motion-demo.tsx" },
  ProgressBarDemo: { Demo: ProgressBarDemo, file: "progress-bar-demo.tsx" },
  RouteModalDemo: { Demo: RouteModalDemo, file: "route-modal-demo.tsx", center: true },
  SecretFieldDemo: { Demo: SecretFieldDemo, file: "secret-field-demo.tsx" },
  SelectDemo: { Demo: SelectDemo, file: "select-demo.tsx" },
  SeparatorDemo: { Demo: SeparatorDemo, file: "separator-demo.tsx" },
  SkeletonDemo: { Demo: SkeletonDemo, file: "skeleton-demo.tsx" },
  StackDemo: { Demo: StackDemo, file: "stack-demo.tsx" },
  StatusDotDemo: { Demo: StatusDotDemo, file: "status-dot-demo.tsx" },
  StatusLabelDemo: { Demo: StatusLabelDemo, file: "status-label-demo.tsx" },
  TabsDemo: { Demo: TabsDemo, file: "tabs-demo.tsx" },
  TabsControlledDemo: { Demo: TabsControlledDemo, file: "tabs-controlled-demo.tsx" },
  TextareaDemo: { Demo: TextareaDemo, file: "textarea-demo.tsx" },
  ToasterDemo: { Demo: ToasterDemo, file: "toaster-demo.tsx", center: true },
  ToggleDemo: { Demo: ToggleDemo, file: "toggle-demo.tsx", center: true },
  ValidatedFormDemo: { Demo: ValidatedFormDemo, file: "validated-form-demo.tsx" },
  TypographyDemo: { Demo: TypographyDemo, file: "typography-demo.tsx" },
  UpdatedAgoDemo: { Demo: UpdatedAgoDemo, file: "updated-ago-demo.tsx" },
  WizardDemo: { Demo: WizardDemo, file: "wizard-demo.tsx" },
} as const satisfies Record<string, DemoEntry>;

export type DemoKey = keyof typeof demoRegistry;
