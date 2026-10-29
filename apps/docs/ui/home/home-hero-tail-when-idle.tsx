"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Defers decorative hero preview until idle to shrink home TBT (#618). */
export function HomeHeroTailWhenIdle({
  placeholder,
  children,
}: {
  placeholder: ReactNode;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(enable, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(enable, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return ready ? children : placeholder;
}
