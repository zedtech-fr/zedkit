"use client";

import type { ComponentProps } from "react";
import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import {
  FullSearchTrigger,
  type FullSearchTriggerProps,
  type SearchTriggerProps,
} from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { ThemeSwitch, type ThemeSwitchProps } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "fumadocs-ui/layouts/docs/slots/sidebar";
import { IconButton, cn } from "@zedtech/zedkit-ui";

const noop = () => () => {};

export function SiteSearchTrigger({ hideIfDisabled, className }: SearchTriggerProps) {
  const { setOpenSearch, enabled } = useSearchContext();
  if (hideIfDisabled && !enabled) return null;
  const label = "Search documentation";
  return (
    <IconButton
      label={label}
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setOpenSearch(true)}
      data-search=""
    >
      <Search />
    </IconButton>
  );
}

export function SiteFullSearchTrigger(props: FullSearchTriggerProps) {
  const label = "Search documentation";
  return <FullSearchTrigger {...props} title={label} aria-label={label} />;
}

export function SiteThemeSwitch({ className, mode = "light-dark" }: ThemeSwitchProps) {
  const label = "Toggle light and dark theme";
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (mode !== "light-dark") {
    return <ThemeSwitch className={className} mode={mode} />;
  }
  const value = mounted ? resolvedTheme : null;
  const handleThemeChange = (newTheme: string) => {
    if (document?.startViewTransition) {
      document.startViewTransition(() => flushSync(() => setTheme(newTheme)));
    } else {
      setTheme(newTheme);
    }
  };
  return (
    <IconButton
      label={label}
      variant="outline"
      className={cn("rounded-full border p-1", className)}
      onClick={() => handleThemeChange(value === "light" ? "dark" : "light")}
      data-theme-toggle=""
    >
      {value === "dark" ? <Moon className="size-icon-control" /> : <Sun className="size-icon-control" />}
    </IconButton>
  );
}

export function SiteSidebarTrigger(props: ComponentProps<"button">) {
  const { open } = useSidebar();
  const label = open ? "Close navigation sidebar" : "Open navigation sidebar";
  return <SidebarTrigger title={label} {...props} />;
}

/** Fumadocs header slots shared by home and docs layouts. */
export const siteChromeSlots = {
  themeSwitch: SiteThemeSwitch,
  searchTrigger: {
    sm: SiteSearchTrigger,
    full: SiteFullSearchTrigger,
  },
} as const;

export const docsChromeSlots = {
  ...siteChromeSlots,
  sidebar: {
    provider: SidebarProvider,
    root: Sidebar,
    trigger: SiteSidebarTrigger,
    useSidebar,
  },
} as const;
