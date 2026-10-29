"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";

function DemoFallback() {
  return <Stack className="min-h-32" aria-hidden="true" />;
}

/** Only the demos the home page renders — not the full docs registry. */
export const homeGalleryDemos: Record<string, ComponentType> = {
  BadgeDemo: dynamic(
    () => import("@/components/demos/badge-demo").then((mod) => mod.BadgeDemo),
    { loading: DemoFallback },
  ),
  ButtonDemo: dynamic(
    () => import("@/components/demos/button-demo").then((mod) => mod.ButtonDemo),
    { loading: DemoFallback },
  ),
  InputDemo: dynamic(
    () => import("@/components/demos/input-demo").then((mod) => mod.InputDemo),
    { loading: DemoFallback },
  ),
  ConfirmDialogDemo: dynamic(
    () => import("@/components/demos/confirm-dialog-demo").then((mod) => mod.ConfirmDialogDemo),
    { loading: DemoFallback },
  ),
  DrawerDemo: dynamic(
    () => import("@/components/demos/drawer-demo").then((mod) => mod.DrawerDemo),
    { loading: DemoFallback },
  ),
};
