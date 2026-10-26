"use client";

import * as React from "react";

/** Matches Tailwind `sm` (640px): phones and narrow viewports. */
const MOBILE_MEDIA = "(max-width: 639px)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(MOBILE_MEDIA);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window.innerWidth === "number" && window.innerWidth < 640) {
    return true;
  }
  return window.matchMedia(MOBILE_MEDIA).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useMobileViewport(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
