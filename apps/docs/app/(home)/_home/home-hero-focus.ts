"use client";

import { useLayoutEffect, useRef } from "react";

/** Restore focus after a live/placeholder swap so the footer change does not dump it to body. */
export function useRestoreFocusOnLiveSwap(liveKey: string | null, showPause: boolean) {
  const cardRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<"pause" | "link" | "other" | null>(null);

  useLayoutEffect(() => {
    const root = cardRef.current;
    const pause = pauseRef.current;
    if (root === null) return;
    const active = document.activeElement;
    const contained = active instanceof Node && root.contains(active);
    const onHiddenPause = !showPause && pause !== null && active === pause;
    if (contained && !onHiddenPause) return;
    if (lastFocus.current === null && !onHiddenPause) return;
    if (lastFocus.current === "link" || onHiddenPause) {
      const link = root.querySelector("a");
      if (link instanceof HTMLElement) link.focus();
      return;
    }
    if (lastFocus.current === "pause" && showPause) pause?.focus();
  }, [liveKey, showPause]);

  return {
    cardRef,
    pauseRef,
    onFocusCapture: (event: { target: EventTarget | null }) => {
      const target = event.target;
      if (target === pauseRef.current) lastFocus.current = "pause";
      else if (target instanceof Element && target.closest("a") !== null) lastFocus.current = "link";
      else lastFocus.current = "other";
    },
    onBlurCapture: (event: { currentTarget: HTMLElement; relatedTarget: EventTarget | null }) => {
      const next = event.relatedTarget;
      if (next instanceof Node && event.currentTarget.contains(next)) return;
      if (next instanceof Node) lastFocus.current = null;
    },
  };
}
