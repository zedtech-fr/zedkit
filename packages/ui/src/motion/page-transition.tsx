"use client";

import type * as React from "react";

import { cn } from "../utils.js";

export type PageTransitionPreset = "settle" | "reveal";

export interface PageTransitionProps extends React.ComponentProps<"div"> {
  /**
   * Pathname (or other route id). Changing it remounts the inner content so
   * named motion plays once. Omit when the host already remounts (Next `template.tsx`).
   */
  routeKey?: string;
  /** Default `settle` (opacity). `reveal` adds the signature fade+up translate. */
  preset?: PageTransitionPreset;
}

function PageTransition({
  children,
  routeKey,
  preset = "settle",
  className,
  ...props
}: PageTransitionProps) {
  const motionClass = preset === "reveal" ? "motion-reveal" : "motion-settle";
  return (
    <div data-slot="page-transition" className={cn(className)} {...props}>
      <div key={routeKey ?? "page"} className={motionClass}>
        {children}
      </div>
    </div>
  );
}

export { PageTransition };
