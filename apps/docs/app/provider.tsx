"use client";

import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import StaticSearchDialog from "../components/search";
import { SiteChromeA11yPatch } from "@/ui/site-chrome-a11y";
import { ThemeColorMeta } from "@/ui/theme-color-meta";

/** Client wrapper: passes the static search dialog into the provider. */
export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider search={{ SearchDialog: StaticSearchDialog }}>
      <SiteChromeA11yPatch />
      <ThemeColorMeta />
      {children}
    </RootProvider>
  );
}
