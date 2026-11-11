"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { Button, type ButtonProps } from "../button/button.js";
import { isMotionReduced } from "../motion/motion-preference.js";
import { useUiMessages } from "../ui-provider.js";

export interface StickToBottomOptions {
  /** Distance from the end (px) that still counts as latched. Defaults to 8. */
  offset?: number;
  /**
   * Scroll behaviour when motion is allowed. Defaults to `"auto"` (jump).
   * `"smooth"` while content keeps growing is a continuous animation.
   */
  behavior?: "auto" | "smooth";
}

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function atBottom(el: HTMLElement, offset: number): boolean {
  return el.scrollHeight - el.clientHeight - el.scrollTop <= offset;
}

function endTop(el: HTMLElement): number {
  return Math.max(0, el.scrollHeight - el.clientHeight);
}

function scrollMode(behavior: "auto" | "smooth"): ScrollBehavior {
  return isMotionReduced() || behavior !== "smooth" ? "instant" : "smooth";
}

function latchOffset(value: number | undefined): number {
  return Math.max(0, value != null && Number.isFinite(value) ? value : 8);
}

type PinGuard = {
  frame: number | null;
  node: HTMLElement | null;
  onEnd: (() => void) | null;
};

function releasePinGuard(guard: PinGuard, programmaticRef: { current: boolean }): void {
  if (guard.frame != null) cancelAnimationFrame(guard.frame);
  if (guard.node && guard.onEnd) guard.node.removeEventListener("scrollend", guard.onEnd);
  guard.frame = null;
  guard.node = null;
  guard.onEnd = null;
  programmaticRef.current = false;
}

function pinScrollerToEnd(
  el: HTMLElement,
  behavior: "auto" | "smooth",
  offset: number,
  guard: PinGuard,
  programmaticRef: { current: boolean },
  setStuck: (next: boolean) => void,
): void {
  releasePinGuard(guard, programmaticRef);
  programmaticRef.current = true;
  const mode = scrollMode(behavior);
  const top = endTop(el);
  const canScrollTo = typeof el.scrollTo === "function";
  if (canScrollTo) {
    el.scrollTo({ top, left: 0, behavior: mode });
  } else {
    el.scrollTop = top;
  }
  if (mode !== "smooth" || !canScrollTo) {
    guard.frame = requestAnimationFrame(() => {
      guard.frame = null;
      programmaticRef.current = false;
    });
    return;
  }
  const onEnd = () => {
    releasePinGuard(guard, programmaticRef);
    setStuck(atBottom(el, offset));
  };
  guard.node = el;
  guard.onEnd = onEnd;
  el.addEventListener("scrollend", onEnd);
}

function observeScroller(
  node: HTMLElement,
  offset: number,
  programmaticRef: { current: boolean },
  stuckRef: { current: boolean },
  setStuck: (next: boolean) => void,
  pinToEnd: () => void,
  releasePinGuard: () => void,
): () => void {
  const onScroll = () => {
    if (programmaticRef.current) {
      if (!atBottom(node, offset)) return;
      releasePinGuard();
    }
    setStuck(atBottom(node, offset));
  };
  let frame: number | null = null;
  const scheduleGrow = () => {
    if (frame != null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (stuckRef.current) pinToEnd();
    });
  };
  node.addEventListener("scroll", onScroll, { passive: true });
  const mutation = typeof MutationObserver === "undefined" ? null : new MutationObserver(scheduleGrow);
  mutation?.observe(node, { childList: true, subtree: true, characterData: true });
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleGrow);
  resize?.observe(node);
  if (stuckRef.current) pinToEnd();
  return () => {
    node.removeEventListener("scroll", onScroll);
    mutation?.disconnect();
    resize?.disconnect();
    if (frame != null) cancelAnimationFrame(frame);
    releasePinGuard();
  };
}

/**
 * Follow the end of a scroll parent until the reader scrolls up.
 * `jumpToLatest` pins to the end and resumes following.
 */
export function useStickToBottom(
  scroller: RefObject<HTMLElement | null>,
  options: StickToBottomOptions = {},
): { isStuck: boolean; jumpToLatest: () => void } {
  const { behavior = "auto" } = options;
  const offset = latchOffset(options.offset);
  const [isStuck, setIsStuck] = useState(true);
  const stuckRef = useRef(true);
  const programmaticRef = useRef(false);
  const pinGuard = useRef<PinGuard>({ frame: null, node: null, onEnd: null });
  const [node, setNode] = useState<HTMLElement | null>(null);

  const setStuck = useCallback((next: boolean) => {
    stuckRef.current = next;
    setIsStuck(next);
  }, []);

  const releaseGuard = useCallback(() => {
    releasePinGuard(pinGuard.current, programmaticRef);
  }, []);

  const pinToEnd = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    pinScrollerToEnd(el, behavior, offset, pinGuard.current, programmaticRef, setStuck);
  }, [scroller, behavior, offset, setStuck]);

  const jumpToLatest = useCallback(() => {
    setStuck(true);
    pinToEnd();
    scroller.current?.focus({ preventScroll: true });
  }, [pinToEnd, setStuck, scroller]);

  useIsomorphicLayoutEffect(() => {
    setNode((prev) => (prev === scroller.current ? prev : scroller.current));
  });

  useEffect(() => {
    if (!node) return undefined;
    return observeScroller(node, offset, programmaticRef, stuckRef, setStuck, pinToEnd, releaseGuard);
  }, [node, offset, pinToEnd, setStuck, releaseGuard]);

  return { isStuck, jumpToLatest };
}

export interface JumpToLatestProps extends Omit<ButtonProps, "children" | "asChild" | "type" | "aria-label"> {
  /** Hide the control while the reader is still following the end. */
  stuck: boolean;
  /** Visible label; kit chrome is the default. Empty or whitespace falls back to kit chrome. */
  label?: string;
}

/** Named recovery control: jump to the end and resume following. Hidden while latched. */
export function JumpToLatest({
  stuck,
  label,
  className,
  variant = "outline",
  ...props
}: JumpToLatestProps) {
  const messages = useUiMessages();
  if (stuck) return null;
  const text = label?.trim() ? label : messages.jumpToLatest;
  return (
    <Button
      variant={variant}
      className={className}
      {...props}
      data-slot="jump-to-latest"
      type="button"
    >
      {text}
    </Button>
  );
}
