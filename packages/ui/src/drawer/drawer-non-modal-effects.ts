import * as React from "react";

import type { DrawerDirection } from "./drawer-non-modal-context.js";

type NonModalDrawerFocusProps = {
  open: boolean;
  dismissible: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

/** Fraction of the panel height a body swipe must cover before the sheet closes. */
const NON_MODAL_DISMISS_DRAG_FRACTION = 0.2;

const IGNORE_DISMISS_SELECTOR =
  "input, textarea, select, button, [role='slider'], [contenteditable]:not([contenteditable='false'])";

type DismissKind = "handle" | "body";

function dismissDelta(direction: DrawerDirection, startY: number, y: number): number {
  if (direction === "bottom") return y - startY;
  if (direction === "top") return startY - y;
  return 0;
}

function translateFor(direction: DrawerDirection, delta: number): string {
  const offset = Math.max(0, delta);
  if (direction === "bottom") return `translateY(${offset}px)`;
  if (direction === "top") return `translateY(${-offset}px)`;
  return "";
}

function hasScrolledAncestor(start: EventTarget | null, root: HTMLElement): boolean {
  let node = start instanceof Element ? start : null;
  while (node) {
    if (node instanceof HTMLElement && node.scrollTop > 0) return true;
    if (node === root) break;
    node = node.parentElement;
  }
  return false;
}

function shouldIgnoreBodyTarget(target: EventTarget | null, panel: HTMLElement): boolean {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-slot='drawer-handle']")) return true;
  if (target.closest(IGNORE_DISMISS_SELECTOR)) return true;
  return hasScrolledAncestor(target, panel);
}

function startNonModalDrawerDismiss({
  event,
  kind,
  direction,
  dismissible,
  onOpenChange,
}: {
  event: React.PointerEvent<HTMLElement>;
  kind: DismissKind;
  direction: DrawerDirection;
  dismissible: boolean;
  onOpenChange: (open: boolean) => void;
}): void {
  if (!dismissible) return;
  if (direction !== "bottom" && direction !== "top") return;
  if (event.isPrimary === false || event.button !== 0) return;
  if (event.defaultPrevented) return;

  const panel =
    kind === "body"
      ? event.currentTarget
      : (event.currentTarget.closest("[data-slot='drawer-content']") as HTMLElement | null);
  if (!panel) return;
  if (kind === "body" && shouldIgnoreBodyTarget(event.target, panel)) return;

  const startY = event.clientY;
  const threshold = Math.max(panel.getBoundingClientRect().height, 1) * NON_MODAL_DISMISS_DRAG_FRACTION;
  const pointerId = event.pointerId;
  const reduceMotion =
    document.documentElement.getAttribute("data-motion") === "reduce" ||
    (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  event.currentTarget.setPointerCapture?.(pointerId);

  const clearTransform = () => {
    panel.style.transform = "";
  };

  const onMove = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    if (!panel.isConnected) {
      finish(moveEvent, true);
      return;
    }
    const delta = dismissDelta(direction, startY, moveEvent.clientY);
    if (!reduceMotion) panel.style.transform = translateFor(direction, delta);
  };

  const finish = (endEvent: PointerEvent, cancelled: boolean) => {
    if (endEvent.pointerId !== pointerId) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    if (panel.isConnected) clearTransform();
    if (cancelled) return;
    const delta = dismissDelta(direction, startY, endEvent.clientY);
    if (kind === "handle" || delta >= threshold) onOpenChange(false);
  };

  const onUp = (endEvent: PointerEvent) => finish(endEvent, false);
  const onCancel = (endEvent: PointerEvent) => finish(endEvent, true);

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
}

function useNonModalDrawerEscape({ open, dismissible, onOpenChange }: NonModalDrawerFocusProps): void {
  React.useEffect(() => {
    if (!open || !dismissible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissible, onOpenChange, open]);
}

function useNonModalDrawerFocusRestore({ open, triggerRef }: NonModalDrawerFocusProps): void {
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    const trigger = triggerRef.current;
    if (trigger && document.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    }
  }, [open, triggerRef]);
}

export { startNonModalDrawerDismiss, useNonModalDrawerEscape, useNonModalDrawerFocusRestore };
