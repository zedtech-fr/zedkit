"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";

import { fitSearchPillSheet } from "@/ui/search-pill-fit";

/** Anchors the search bar to the visible top (safe area + visual viewport). */
function useTopAnchor(active: boolean, target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = target.current;
    if (!active || !element) return;
    const update = () => {
      const offset = Math.max(0, Math.round(viewport?.offsetTop ?? 0));
      element.style.top = `calc(${offset}px + max(0.75rem, env(safe-area-inset-top)))`;
      fitSearchPillSheet();
    };
    update();
    const settle = [120, 320, 640].map((delay) => window.setTimeout(update, delay));
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("focusin", update);
    return () => {
      settle.forEach((id) => window.clearTimeout(id));
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("focusin", update);
      element.style.top = "";
    };
  }, [active, target]);
}

const OPEN_MS = 260;
const CLOSE_MS = 200;
const OPEN_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_EASE = "cubic-bezier(0.4, 0, 1, 1)";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function foldedOnto(bar: HTMLElement, button: HTMLElement): string | null {
  const from = bar.getBoundingClientRect();
  const to = button.getBoundingClientRect();
  if (from.width === 0 || from.height === 0) return null;
  return `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`;
}

export function useSearchPill() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLButtonElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const closing = useRef(false);
  useTopAnchor(open, bar);

  useLayoutEffect(() => {
    const element = bar.current;
    const button = toggle.current;
    if (!open || !element || !button || prefersReducedMotion() || typeof element.animate !== "function") return;
    const folded = foldedOnto(element, button);
    if (!folded) return;
    element.animate(
      [
        { transform: folded, opacity: 0 },
        { opacity: 1, offset: 0.4 },
        { transform: "none", opacity: 1 },
      ],
      { duration: OPEN_MS, easing: OPEN_EASE },
    );
  }, [open]);

  const close = useCallback(() => {
    const element = bar.current;
    const button = toggle.current;
    const folded = element && button ? foldedOnto(element, button) : null;
    if (!element || !folded || prefersReducedMotion() || typeof element.animate !== "function") {
      setOpen(false);
      return;
    }
    if (closing.current) return;
    closing.current = true;
    const finish = () => {
      if (!closing.current) return;
      closing.current = false;
      setOpen(false);
    };
    overlay.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, easing: CLOSE_EASE, fill: "forwards" });
    const fold = element.animate(
      [
        { transform: "none", opacity: 1 },
        { opacity: 1, offset: 0.5 },
        { transform: folded, opacity: 0 },
      ],
      { duration: CLOSE_MS, easing: CLOSE_EASE, fill: "forwards" },
    );
    fold.onfinish = finish;
    fold.oncancel = finish;
    window.setTimeout(finish, CLOSE_MS + 120);
  }, []);

  useEffect(() => {
    if (wasOpen.current && !open) toggle.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    closing.current = false;
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const openSearch = useCallback(() => setOpen(true), []);

  return { open, close, openSearch, bar, overlay, toggle };
}
