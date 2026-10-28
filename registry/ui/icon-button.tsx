"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

export interface IconButtonProps extends ButtonProps {
  /** Accessible name and native tooltip (visible on hover / long-press). */
  label: string;
}

/** Icon-only control with matching `aria-label` and `title`. */
export function IconButton({ label, children, size = "icon", ...props }: IconButtonProps) {
  return (
    <Button data-slot="icon-button" type="button" size={size} {...props} aria-label={label} title={label}>
      {children}
    </Button>
  );
}
