"use client";

import { useEffect } from "react";

import { isMotionReduced } from "./motion/motion-preference.js";

/** Mount once near the root. No options. */
export type InPageAnchorScrollProps = Record<string, never>;

function decodeHash(raw: string): string {
  const bytes = raw.match(/%[0-9a-f]{2}|[^]/giu) ?? [];
  const encoder = new TextEncoder();
  return new TextDecoder().decode(
    new Uint8Array(
      bytes.flatMap((part) =>
        part.length === 3 && part[0] === "%"
          ? [Number.parseInt(part.slice(1), 16)]
          : [...encoder.encode(part)],
      ),
    ),
  );
}

function fragmentTarget(raw: string): HTMLElement | null {
  if (!raw) return null;
  return document.getElementById(raw) ?? document.getElementById(decodeHash(raw));
}

/** Scroll a hash target into view and move focus. Instant when motion is reduced. */
export function scrollToFragment(target: HTMLElement): void {
  // Native focusables already participate in tab order (`tabIndex >= 0`
  // without an attribute). Stamping -1 would drop them from the tab sequence.
  if (!target.hasAttribute("tabindex") && target.tabIndex < 0) target.tabIndex = -1;
  target.focus({ preventScroll: true });
  const behavior: ScrollBehavior = isMotionReduced() ? "instant" : "smooth";
  target.scrollIntoView({ behavior, block: "start" });
}

function sameDocumentFragment(anchor: HTMLAnchorElement): string | null {
  if (anchor.hasAttribute("download")) return null;
  const targetAttr = anchor.getAttribute("target");
  if (targetAttr !== null && targetAttr !== "" && targetAttr !== "_self") return null;
  const href = anchor.getAttribute("href");
  if (href === null || href === "") return null;
  if (typeof URL.canParse !== "function" || !URL.canParse(href, location.href)) return null;
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) return null;
  if (url.pathname !== location.pathname) return null;
  if (url.search !== location.search) return null;
  const raw = url.hash.slice(1);
  return raw === "" ? null : raw;
}

function syncHash(next: string): void {
  if (location.hash === next) return;
  const oldURL = location.href;
  history.pushState(null, "", next);
  // pushState never fires hashchange; hash-only listeners (in-page
  // selection) would otherwise go stale.
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: location.href }));
}

function onDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  const raw = event.target;
  if (!(raw instanceof Node)) return;
  const el = raw instanceof Element ? raw : raw.parentElement;
  if (el === null) return;
  const host = el.closest("a");
  if (!(host instanceof HTMLAnchorElement)) return;
  const id = sameDocumentFragment(host);
  if (id === null) return;
  const node = fragmentTarget(id);
  if (node === null) return;
  event.preventDefault();
  syncHash(`#${id}`);
  scrollToFragment(node);
}

/** Listen for same-document fragment clicks, including a repeat of the current hash. */
export function useInPageAnchorScroll(): void {
  useEffect(() => {
    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);
}

/** Component form of `useInPageAnchorScroll`: renders nothing. */
export function InPageAnchorScroll(props?: InPageAnchorScrollProps): null {
  void props;
  useInPageAnchorScroll();
  return null;
}
