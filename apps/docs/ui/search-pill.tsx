"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStaticSearch, type SearchResultRecord } from "fumadocs-core/search/client";
import { Search, X } from "lucide-react";

const iconButtonClassName =
  "inline-flex min-h-[max(2.75rem,44px)] min-w-[max(2.75rem,44px)] flex-none items-center justify-center rounded-full focus-ring-control";

const SHEET_ID = "phone-search-results";
/** Air (px) kept between the results sheet and the bottom of what the visitor can see. */
const SHEET_BOTTOM_MARGIN = 16;
/** Gap (px) between the bar and the sheet (`mt-2`). */
const SHEET_BAR_GAP = 8;
/** The sheet never gets shorter than this, however small the visible area. */
const SHEET_MIN_HEIGHT = 96;

/**
 * Caps the results sheet to the room that is really visible below the bar:
 * the visual viewport (so the software keyboard is out of the sum) minus
 * what the bar takes from its top and a margin. The list scrolls inside the
 * sheet; its first line sits right under the bar and is never pushed out of view.
 */
function fitSheet() {
  const sheet = document.getElementById(SHEET_ID);
  const bar = sheet?.parentElement;
  if (!sheet || !bar) return;
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const height = viewport?.height ?? window.innerHeight;
  const room = top + height - bar.getBoundingClientRect().bottom - SHEET_BAR_GAP - SHEET_BOTTOM_MARGIN;
  sheet.style.maxHeight = `${Math.max(SHEET_MIN_HEIGHT, Math.floor(room))}px`;
}

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
      fitSheet();
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

function flatten(items: ReadonlyArray<SearchResultRecord | { type: "table"; rows: SearchResultRecord[] }>): SearchResultRecord[] {
  return items.flatMap((item) => (item.type === "table" ? item.rows : [item]));
}

/** Drop markdown markers so phone results read like desktop snippets. */
function plainResultText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .trim();
}

/** Search field and results. Mounted only while open, so the index is fetched on demand. */
function PillBody({ onClose }: { onClose: () => void }) {
  const { search, onSearchChange, data, isLoading } = useStaticSearch({ search: { tolerance: 1 } });
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = data && search.trim() ? flatten(data.items).slice(0, 12) : [];
  const showSheet = search.trim().length > 0;

  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  // A new query starts at the top of the list, and the sheet is sized to what is visible.
  useLayoutEffect(() => {
    document.getElementById(SHEET_ID)?.scrollTo({ top: 0 });
    fitSheet();
  }, [search, showSheet, results.length, isLoading]);

  // The pill can change height after the sheet is sized (fonts arriving, a wrapped hint): follow it.
  useEffect(() => {
    const anchor = document.getElementById(SHEET_ID)?.parentElement;
    if (!anchor || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fitSheet);
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [showSheet]);

  return (
    <>
      {showSheet ? (
        <div
          id={SHEET_ID}
          className="absolute top-full right-0 left-0 mt-2 max-h-[60dvh] overflow-y-auto overscroll-contain rounded-xl border bg-popover text-popover-foreground shadow-lg transition-[opacity,translate] duration-200 motion-reduce:transition-none starting:-translate-y-2 starting:opacity-0"
        >
          {results.length > 0 ? (
            <>
            <p className="sticky top-0 z-10 border-b bg-popover px-4 py-2 text-xs font-medium text-muted-foreground">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
            <ul aria-label="Search results" className="py-1">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.url}
                    onClick={onClose}
                    className="flex min-h-[max(2.75rem,44px)] flex-col justify-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
                  >
                    <span className={result.type === "page" ? "font-medium" : "text-muted-foreground"}>
                      {plainResultText(result.content)}
                    </span>
                    {result.breadcrumbs && result.breadcrumbs.length > 0 ? (
                      <span className="text-xs text-muted-foreground">{result.breadcrumbs.join(" › ")}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
            </>
          ) : (
            <p role="status" className="px-4 py-3 text-sm text-muted-foreground">
              {isLoading ? "Searching…" : "No results"}
            </p>
          )}
        </div>
      ) : null}
      <input
        id="nd-search-pill-input"
        ref={inputRef}
        type="search"
        enterKeyHint="go"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && results[0]) {
            router.push(results[0].url);
            onClose();
          }
        }}
        aria-label="Search the documentation"
        aria-controls={showSheet ? SHEET_ID : undefined}
        placeholder="Search the docs"
        className="h-full min-w-0 flex-1 bg-transparent pl-4 text-control text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className={`${iconButtonClassName} text-muted-foreground hover:text-foreground`}
      >
        <X aria-hidden="true" className="size-icon-control" />
      </button>
    </>
  );
}

/**
 * Phone search: a round magnifier at the bottom-right opens a search bar anchored at the top of the
 * screen (below the status bar), with the results in a sheet right under it. The bar does not follow
 * the software keyboard; the sheet is capped to the visual viewport so the keyboard never hides it.
 */
export function SearchPill() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useTopAnchor(open, bar);

  // However the search closes (close button, Escape, overlay tap, route change), focus goes back to the magnifier.
  useEffect(() => {
    if (wasOpen.current && !open) toggle.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden" data-search-pill>
      {open ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-overlay cursor-default bg-overlay/30 transition-opacity duration-200 motion-reduce:transition-none starting:opacity-0"
          />
          <div
            ref={bar}
            className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] left-[max(1rem,env(safe-area-inset-left))] z-overlay"
          >
            <div
              role="search"
              className="relative flex h-[max(2.75rem,44px)] items-center rounded-full bg-popover text-popover-foreground shadow-lg ring-1 ring-border transition-none"
            >
              <PillBody onClose={() => setOpen(false)} />
            </div>
          </div>
        </>
      ) : null}
      <div className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-overlay">
        <button
          ref={toggle}
          type="button"
          aria-label="Search the documentation"
          aria-expanded={open}
          onClick={() => (open ? document.querySelector<HTMLInputElement>("#nd-search-pill-input")?.focus() : setOpen(true))}
          className={`${iconButtonClassName} bg-primary text-primary-foreground shadow-lg active:scale-95 motion-reduce:transition-none`}
        >
          <Search aria-hidden="true" className="size-icon-control" />
        </button>
      </div>
    </div>
  );
}
