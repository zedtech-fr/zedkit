"use client";

import * as React from "react";

/** Matches Tailwind `sm` (640px): phones and narrow viewports. */
const MOBILE_MEDIA = "(max-width: 639px)";

function readMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < 640 || window.matchMedia(MOBILE_MEDIA).matches;
}

export function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = React.useState(readMobileViewport);

  React.useLayoutEffect(() => {
    const sync = () => setIsMobile(readMobileViewport());
    sync();
    const mql = window.matchMedia(MOBILE_MEDIA);
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
