"use client";

import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "./utils.js";

export interface IconLabelProps extends React.ComponentProps<"span"> {
  icon: LucideIcon;
  children: React.ReactNode;
}

/** Quiet inline icon + label; icon is decorative (aria-hidden). */
export function IconLabel({ icon: Icon, children, className, ...props }: IconLabelProps) {
  return (
    <span data-slot="icon-label" className={cn("inline-flex max-w-full min-w-0 items-center gap-1.5 text-muted-foreground", className)} {...props}>
      <Icon aria-hidden className="size-icon-control shrink-0" focusable={false} />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
