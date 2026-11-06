import type { Viewport } from "next";

/** Browser chrome colour before hydration (docs shell background); `ThemeColorMeta` then follows the active theme. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};
