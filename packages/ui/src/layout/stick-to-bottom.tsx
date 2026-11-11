"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { Button, type ButtonProps } from "../button/button.js";
import { isMotionReduced } from "../motion/motion-preference.js";
import { useUiMessages } from "../ui-provider.js";
import { cn } from "../utils.js";

export interface StickToBottomOptions {
  /** Distance from the end (px) that still counts as latched. Defaults to 8. */
  offset?: number;
  /** Scroll behaviour when motion is allowed. Defaults to `"auto"` (jump). */
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

function observeScroller(
  node: HTMLElement,
  offset: number,
  programmaticRef: { current: boolean },
  stuckRef: { current: boolean },
  setStuck: (next: boolean) => void,
  pinToEnd: () => void,
): () => void {
  const onScroll = () => {
    if (programmaticRef.current) return;
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
  const { offset = 8, behavior = "auto" } = options;
  const [isStuck, setIsStuck] = useState(true);
  const stuckRef = useRef(true);
  const programmaticRef = useRef(false);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const setStuck = useCallback((next: boolean) => {
    stuckRef.current = next;
    setIsStuck(next);
  }, []);

  const pinToEnd = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    programmaticRef.current = true;
    el.scrollTo({ top: endTop(el), left: 0, behavior: scrollMode(behavior) });
    requestAnimationFrame(() => {
      programmaticRef.current = false;
    });
  }, [scroller, behavior]);

  const jumpToLatest = useCallback(() => {
    setStuck(true);
    pinToEnd();
  }, [pinToEnd, setStuck]);

  useIsomorphicLayoutEffect(() => {
    setNode((prev) => (prev === scroller.current ? prev : scroller.current));
  });

  useEffect(() => {
    if (!node) return undefined;
    return observeScroller(node, offset, programmaticRef, stuckRef, setStuck, pinToEnd);
  }, [node, offset, pinToEnd, setStuck]);

  return { isStuck, jumpToLatest };
}

export interface JumpToLatestProps extends Omit<ButtonProps, "children"> {
  /** Hide the control while the reader is still following the end. */
  stuck: boolean;
  /** Visible label; kit chrome is the default. */
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
  return (
    <Button
      data-slot="jump-to-latest"
      type="button"
      variant={variant}
      className={cn(className)}
      {...props}
    >
      {label ?? messages.jumpToLatest}
    </Button>
  );
}
