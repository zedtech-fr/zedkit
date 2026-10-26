"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog.js";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./drawer.js";
import { cn } from "./utils.js";

export type RouteModalVariant = "drawer" | "dialog";
export type RouteModalSize = "sm" | "md" | "lg";
export type RouteModalDirection = "top" | "right" | "bottom" | "left";

export interface RouteModalProps {
  title: string;
  description?: string;
  variant?: RouteModalVariant;
  /** Drawer edge (drawer variant only). Defaults to `right` (list detail). */
  direction?: RouteModalDirection;
  size?: RouteModalSize;
  children: React.ReactNode;
  /**
   * Navigation action (e.g. `() => closeRoute({ ...router, fallback })`),
   * called AFTER the exit animation has played — immediately under
   * reduced motion. Never twice, never after unmount.
   */
  onClose: () => void;
  className?: string;
}

// Exit durations mirror the motion tokens (--motion-slow/base): the
// modal closes visually first, then onClose navigates.
const EXIT_MS: Record<RouteModalVariant, number> = { drawer: 250, dialog: 200 };

const DRAWER_SIZES: Record<RouteModalSize, string | undefined> = {
  // Important: DrawerContent bakes direction-scoped max-widths at higher
  // specificity, so bare overrides would lose the cascade.
  sm: "sm:max-w-route-modal-sm!",
  md: undefined,
  lg: "sm:max-w-route-modal-drawer-lg!",
};

const DIALOG_SIZES: Record<RouteModalSize, string | undefined> = {
  sm: "max-w-route-modal-sm",
  md: undefined,
  lg: "max-w-route-modal-dialog-lg",
};

/**
 * Route-driven modal for intercepted routes: always open while
 * mounted; every dismiss (close button, Escape, backdrop) plays the
 * exit animation, then calls `onClose` to navigate back. Drawer on
 * the right by default, centered dialog as the `dialog` variant.
 */
export function RouteModal({
  title,
  description,
  variant = "drawer",
  direction = "right",
  size = "md",
  children,
  onClose,
  className,
}: RouteModalProps) {
  const [open, setOpen] = React.useState(true);
  const closing = React.useRef(false);
  const timer = React.useRef(0);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const requestClose = React.useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    timer.current = window.setTimeout(onClose, EXIT_MS[variant]);
  }, [onClose, variant]);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) requestClose();
    },
    [requestClose],
  );

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={cn(DIALOG_SIZES[size], className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  // Width sizes apply to side drawers only: top/bottom sheets span
  // the full width, so narrowing them would look broken.
  const drawerSizeClass = direction === "left" || direction === "right" ? DRAWER_SIZES[size] : undefined;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction={direction}>
      <DrawerContent className={cn(drawerSizeClass, className)}>
        <DrawerClose asChild>
          <Button variant="ghost" size="icon" aria-label="Close" className="absolute top-route-modal-close-offset right-route-modal-close-offset">
            <X className="size-icon-control" />
          </Button>
        </DrawerClose>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
