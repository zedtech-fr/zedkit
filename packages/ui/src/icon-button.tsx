"use client";

import * as React from "react";
import { Button, type ButtonProps } from "./button.js";

export interface IconButtonProps extends ButtonProps {
  /** Accessible name and native tooltip (visible on hover / long-press). */
  label: string;
}

/** Icon-only control with matching `aria-label` and `title`. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, size = "icon", ...props }, ref) => (
    <Button ref={ref} type="button" size={size} {...props} aria-label={label} title={label}>
      {children}
    </Button>
  ),
);
IconButton.displayName = "IconButton";
