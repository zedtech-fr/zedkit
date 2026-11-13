import * as React from "react";
import { tryCatch } from "@zedtech/zedkit-core";

import { isMotionReduced } from "../motion/motion-preference.js";
import type { DrawerDirection } from "./drawer-non-modal-context.js";

type NonModalDrawerFocusProps = {
  open: boolean;
  dismissible: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

type SheetEdge = Extract<DrawerDirection, "bottom" | "top">;

/** Fraction of the panel height a body swipe must cover before the sheet closes. */
const NON_MODAL_DISMISS_DRAG_FRACTION = 0.2;

/** Handle close needs a drag toward the edge; a tap is a no-op. */
const HANDLE_CLOSE_SLOP_PX = 8;

/** Capture only after the pointer has moved, so clicks and text selection keep working. */
const POINTER_CAPTURE_SLOP_PX = 8;

/** Interactive hosts that must keep pointerup/click. Capture on the panel retargets the click. */
const IGNORE_DISMISS_SELECTOR =
  "a, input, textarea, select, button, option, summary, label, [role='slider'], [role='option'], [role='menuitem'], [role='listbox'], [role='tab'], [role='button'], [role='link'], [contenteditable]:not([contenteditable='false'])";

type DismissKind = "handle" | "body";

function dismissDelta(direction: SheetEdge, startY: number, y: number): number {
  return direction === "bottom" ? y - startY : startY - y;
}

function translateFor(direction: SheetEdge, delta: number): string {
  const offset = Math.max(0, delta);
  return direction === "bottom" ? `translateY(${offset}px)` : `translateY(${-offset}px)`;
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

function shouldClose(kind: DismissKind, delta: number, threshold: number): boolean {
  if (kind === "handle") return delta >= HANDLE_CLOSE_SLOP_PX;
  return delta >= threshold;
}

function hasTextSelection(): boolean {
  const selection = document.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString());
}

function capturePointer(host: HTMLElement, pointerId: number): void {
  tryCatch(() => host.setPointerCapture(pointerId));
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
  const reduceMotion = isMotionReduced();
  const host = event.currentTarget;
  const priorTransform = panel.style.transform;
  let captured = false;

  const clearTransform = () => {
    panel.style.transform = priorTransform;
  };

  const onMove = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    if (!panel.isConnected) {
      finish(moveEvent, true);
      return;
    }
    const delta = dismissDelta(direction, startY, moveEvent.clientY);
    if (!captured && Math.abs(delta) >= POINTER_CAPTURE_SLOP_PX) {
      captured = true;
      capturePointer(host, pointerId);
    }
    if (!reduceMotion) panel.style.transform = translateFor(direction, delta);
  };

  const finish = (endEvent: PointerEvent, cancelled: boolean) => {
    if (endEvent.pointerId !== pointerId) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    if (panel.isConnected) clearTransform();
    if (cancelled) return;
    if (kind === "body" && hasTextSelection()) return;
    const delta = dismissDelta(direction, startY, endEvent.clientY);
    if (shouldClose(kind, delta, threshold)) onOpenChange(false);
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
  const focusWasInside = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    const update = () => {
      const active = document.activeElement;
      focusWasInside.current = active instanceof Element && active.closest("[data-slot='drawer-content']") !== null;
    };
    update();
    document.addEventListener("focusin", update);
    return () => document.removeEventListener("focusin", update);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    if (!focusWasInside.current) return;
    const trigger = triggerRef.current;
    if (trigger && document.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    }
  }, [open, triggerRef]);
}

export { startNonModalDrawerDismiss, useNonModalDrawerEscape, useNonModalDrawerFocusRestore };
