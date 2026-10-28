"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { RootProvider } from "fumadocs-ui/provider/next";
import { SiteChromeA11yPatch } from "@/ui/site-chrome-a11y";
import { ThemeColorMeta } from "@/ui/theme-color-meta";

const StaticSearchDialog = dynamic(() => import("../components/search"));

/** Client wrapper: search dialog JS loads on first open, not on every page. */
export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider search={{ SearchDialog: StaticSearchDialog, preload: false }}>
      <SiteChromeA11yPatch />
      <ThemeColorMeta />
      {children}
    </RootProvider>
  );
}
