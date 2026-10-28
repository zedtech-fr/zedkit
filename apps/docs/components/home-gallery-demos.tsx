"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { Stack } from "@zedtech/zedkit-ui";
import { BadgeDemo } from "@/components/demos/badge-demo";
import { ButtonDemo } from "@/components/demos/button-demo";
import { InputDemo } from "@/components/demos/input-demo";

function OverlayFallback() {
  return <Stack className="min-h-32" aria-hidden="true" />;
}

/** Only the demos the home page renders — not the full docs registry. */
export const homeGalleryDemos: Record<string, ComponentType> = {
  BadgeDemo,
  ButtonDemo,
  InputDemo,
  ConfirmDialogDemo: dynamic(
    () => import("@/components/demos/confirm-dialog-demo").then((mod) => mod.ConfirmDialogDemo),
    { loading: OverlayFallback },
  ),
  DrawerDemo: dynamic(
    () => import("@/components/demos/drawer-demo").then((mod) => mod.DrawerDemo),
    { loading: OverlayFallback },
  ),
};
