import { DocsContainer } from "@/ui/docs-container";
import {
  SiteFullSearchTrigger,
  SiteSearchTrigger,
  SiteThemeSwitch,
} from "@/ui/site-chrome";

// Server-safe module on purpose: these objects are spread inside server layouts.
// Exported from the "use client" site-chrome.tsx they arrived as opaque client
// references, the spread copied nothing and fumadocs fell back to its default
// search/theme triggers (no "Search documentation" label, hidden icon trigger first).
/** Fumadocs header slots shared by home and docs layouts. */
export const siteChromeSlots = {
  themeSwitch: SiteThemeSwitch,
  searchTrigger: {
    sm: SiteSearchTrigger,
    full: SiteFullSearchTrigger,
  },
} as const;

/**
 * Docs shell search lives in DocsDesktopHeader / MobileHeader, not a fumadocs
 * header slot. Theme switch is off (`themeSwitch.enabled: false` on the layout).
 */
export const docsChromeSlots = {
  container: DocsContainer,
} as const;
