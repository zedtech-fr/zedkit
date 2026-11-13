"use client";

import { Search } from "lucide-react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import {
  FullSearchTrigger,
  type FullSearchTriggerProps,
  type SearchTriggerProps,
} from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { ThemeSwitch, type ThemeSwitchProps } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { IconButton, cn } from "@zedtech/zedkit-ui";
import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";

export function SiteSearchTrigger({ hideIfDisabled, className }: SearchTriggerProps) {
  const { setOpenSearch, enabled } = useSearchContext();
  if (hideIfDisabled && !enabled) return null;
  const label = siteChromeCopy.search.triggerAriaLabel;
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

export function SiteFullSearchTrigger({ className, ...props }: FullSearchTriggerProps) {
  return <FullSearchTrigger {...props} className={cn("focus-ring-control", className)} data-search="" />;
}

export function SiteThemeSwitch({ className, mode = "light-dark" }: ThemeSwitchProps) {
  return (
    <div data-theme-toggle="" className="inline-flex shrink-0">
      <ThemeSwitch
        mode={mode}
        className={cn("h-control-height-sm shrink-0 gap-segment p-segment", className)}
      />
    </div>
  );
}

