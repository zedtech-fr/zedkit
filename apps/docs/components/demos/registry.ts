import type { ComponentType } from "react";
import { AlertDemo } from "./alert-demo";
import { AppShellDemo } from "./app-shell-demo";
import { BadgeDemo } from "./badge-demo";
import { ButtonDemo } from "./button-demo";
import { CardDemo } from "./card-demo";
import { ConfirmDialogDemo } from "./confirm-dialog-demo";
import { DataTableDemo } from "./data-table-demo";
import { DetailsDemo } from "./details-demo";
import { DialogDemo } from "./dialog-demo";
import { FieldDemo } from "./field-demo";
import { InputDemo } from "./input-demo";
import { SecretFieldDemo } from "./secret-field-demo";
import { SelectDemo } from "./select-demo";
import { SeparatorDemo } from "./separator-demo";
import { SkeletonDemo } from "./skeleton-demo";
import { StackDemo } from "./stack-demo";
import { TabsDemo } from "./tabs-demo";
import { TextareaDemo } from "./textarea-demo";
import { ToggleDemo } from "./toggle-demo";
import { TypographyDemo } from "./typography-demo";
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
}

export const demoRegistry = {
  AlertDemo: { Demo: AlertDemo, file: "alert-demo.tsx" },
  AppShellDemo: { Demo: AppShellDemo, file: "app-shell-demo.tsx" },
  BadgeDemo: { Demo: BadgeDemo, file: "badge-demo.tsx" },
  ButtonDemo: { Demo: ButtonDemo, file: "button-demo.tsx" },
  CardDemo: { Demo: CardDemo, file: "card-demo.tsx" },
  ConfirmDialogDemo: { Demo: ConfirmDialogDemo, file: "confirm-dialog-demo.tsx" },
  DataTableDemo: { Demo: DataTableDemo, file: "data-table-demo.tsx" },
  DetailsDemo: { Demo: DetailsDemo, file: "details-demo.tsx" },
  DialogDemo: { Demo: DialogDemo, file: "dialog-demo.tsx" },
  FieldDemo: { Demo: FieldDemo, file: "field-demo.tsx" },
  InputDemo: { Demo: InputDemo, file: "input-demo.tsx" },
  SecretFieldDemo: { Demo: SecretFieldDemo, file: "secret-field-demo.tsx" },
  SelectDemo: { Demo: SelectDemo, file: "select-demo.tsx" },
  SeparatorDemo: { Demo: SeparatorDemo, file: "separator-demo.tsx" },
  SkeletonDemo: { Demo: SkeletonDemo, file: "skeleton-demo.tsx" },
  StackDemo: { Demo: StackDemo, file: "stack-demo.tsx" },
  TabsDemo: { Demo: TabsDemo, file: "tabs-demo.tsx" },
  TextareaDemo: { Demo: TextareaDemo, file: "textarea-demo.tsx" },
  ToggleDemo: { Demo: ToggleDemo, file: "toggle-demo.tsx" },
  TypographyDemo: { Demo: TypographyDemo, file: "typography-demo.tsx" },
  WizardDemo: { Demo: WizardDemo, file: "wizard-demo.tsx" },
} as const satisfies Record<string, DemoEntry>;

export type DemoKey = keyof typeof demoRegistry;
