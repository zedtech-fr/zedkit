"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const noop = () => () => {};

function readThemeColor(): string {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  if (!bg) return "#ffffff";
  return `hsl(${bg})`;
}

/** Keeps `<meta name="theme-color">` aligned with the active kit background. */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (!mounted) return;
    const color = readThemeColor();
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [mounted, resolvedTheme]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta) meta.content = readThemeColor();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-identity", "class"] });
    return () => observer.disconnect();
  }, [mounted]);

  return null;
}
