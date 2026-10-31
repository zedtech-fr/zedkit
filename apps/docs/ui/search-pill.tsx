"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { fitSearchPillSheet } from "@/ui/search-pill-fit";

const iconButtonClassName =
  "inline-flex min-h-[max(2.75rem,44px)] min-w-[max(2.75rem,44px)] flex-none items-center justify-center rounded-full focus-ring-control";

const SearchPillBody = dynamic(() => import("@/ui/search-pill-body").then((mod) => mod.SearchPillBody));

/**
 * Anchors `target` to the top of what the visitor can see. It does not follow the keyboard: the bar
 * stays put at the top while the keyboard opens below. The top edge is the visual viewport's own top
 * (the browser may scroll the page when the keyboard opens) plus the safe area, so the bar is never
 * pushed under the status bar or out of view.
 */
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
    // iOS finishes the keyboard animation after the first resize event.
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

/** The bar unrolls from the magnifier to the top of the screen, and folds back into it. */
const OPEN_MS = 260;
const CLOSE_MS = 200;
const OPEN_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_EASE = "cubic-bezier(0.4, 0, 1, 1)";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The transform that squeezes the bar onto the magnifier's box (both are fixed, so viewport coordinates match). */
function foldedOnto(bar: HTMLElement, button: HTMLElement): string | null {
  const from = bar.getBoundingClientRect();
  const to = button.getBoundingClientRect();
  if (from.width === 0 || from.height === 0) return null;
  return `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`;
}

/**
 * Phone search: a round magnifier at the bottom-right opens a search bar anchored at the top of the
 * screen (below the status bar), with the results in a sheet right under it. The bar unrolls from the
 * magnifier and folds back into it; while it is open the magnifier is hidden. The bar does not follow
 * the software keyboard; the sheet is capped to the visual viewport so the keyboard never hides it.
 */
export function SearchPill() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLButtonElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const closing = useRef(false);
  useTopAnchor(open, bar);

  // Opening: the bar travels from the magnifier (bottom right) up to the top of the screen. No travel under reduced motion.
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

  // Closing: the bar folds back into the magnifier, then goes away. Instant under reduced motion.
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

  // However the search closes (close button, Escape, overlay tap, route change), focus goes back to the magnifier.
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

  return (
    <div className="md:hidden" data-search-pill>
      {open ? (
        <>
          <button
            ref={overlay}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="fixed inset-0 z-overlay cursor-default bg-overlay/30 transition-opacity duration-200 motion-reduce:transition-none starting:opacity-0"
          />
          <div
            ref={bar}
            data-search-bar
            className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] left-[max(1rem,env(safe-area-inset-left))] z-overlay origin-top-left"
          >
            <div
              role="search"
              className="relative isolate flex h-[max(2.75rem,44px)] items-center text-popover-foreground transition-none"
            >
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-popover shadow-lg ring-1 ring-border"
              />
              <SearchPillBody onClose={close} />
            </div>
          </div>
        </>
      ) : null}
      <div
        className={`fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-overlay ${open ? "invisible" : ""}`}
      >
        <button
          ref={toggle}
          type="button"
          aria-label="Search the documentation"
          onClick={() => setOpen(true)}
          className={`${iconButtonClassName} bg-primary text-primary-foreground shadow-lg active:scale-95 motion-reduce:transition-none`}
        >
          <Search aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
