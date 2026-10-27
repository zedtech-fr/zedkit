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

// Fallback exit durations (ms) when the motion tokens are unavailable:
// same values as --motion-slow/--motion-base.
const EXIT_MS_FALLBACK: Record<RouteModalVariant, number> = { drawer: 250, dialog: 200 };

/**
 * Exit duration for the variant, read live from the motion tokens so a
 * themed `--motion-slow`/`--motion-base` stays in sync with the exit
 * animation. Falls back to the token defaults when unset (or SSR).
 */
function exitMs(variant: RouteModalVariant): number {
  const fallback = EXIT_MS_FALLBACK[variant];
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variant === "drawer" ? "--motion-slow" : "--motion-base")
    .trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith("ms") ? value : value * 1000;
}

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
    timer.current = window.setTimeout(onClose, exitMs(variant));
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

  // autoFocus: Vaul disables the underlying Radix mount-autofocus
  // by default, which strands focus on the trigger — outside the
  // drawer — so the focus trap never engages and keyboard users
  // tab through the background page. RouteModal is always modal,
  // so moving focus inside on open (and back to the trigger on
  // close, which Radix then handles) is unconditionally correct
  // here. The bare Drawer keeps Vaul's default: non-modal
  // drawers (modal={false}) must not steal focus.
  // Vaul component prop, not the HTML attribute: enabling Radix
  // mount-autofocus is what lets the modal trap engage per WAI-APG.
  return (
    // eslint-disable-next-line jsx-a11y/no-autofocus -- see above (#507)
    <Drawer open={open} onOpenChange={handleOpenChange} direction={direction} autoFocus>
      <DrawerContent className={cn(drawerSizeClass, className)}>
        <DrawerClose asChild>
          <Button variant="ghost" size="icon" aria-label="Close" className="absolute top-overlay-close-offset right-overlay-close-offset">
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
