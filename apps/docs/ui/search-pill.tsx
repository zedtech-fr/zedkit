"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStaticSearch, type SearchResultRecord } from "fumadocs-core/search/client";
import { Search, X } from "lucide-react";

const iconButtonClassName =
  "inline-flex min-h-tap min-w-tap flex-none items-center justify-center rounded-full focus-ring-control";

/** Extra air (px) between the pill and the top of the keyboard or its toolbar, on top of the resting 16px offset. */
const KEYBOARD_GAP = 16;

/** Lifts `target` above the part of the software keyboard that covers the layout viewport (iOS and Android). */
function useKeyboardLift(active: boolean, target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = target.current;
    if (!active || !viewport || !element) return;
    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
      // The keyboard's own toolbar (iOS) is not part of the visual viewport: keep extra air above it.
      element.style.translate = inset > 0 ? `0 -${inset + KEYBOARD_GAP}px` : "";
    };
    update();
    // iOS finishes the keyboard animation and toolbar after the first resize event.
    const settle = [120, 320, 640].map((delay) => window.setTimeout(update, delay));
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("focusin", update);
    return () => {
      settle.forEach((id) => window.clearTimeout(id));
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("focusin", update);
      element.style.translate = "";
    };
  }, [active, target]);
}

function flatten(items: ReadonlyArray<SearchResultRecord | { type: "table"; rows: SearchResultRecord[] }>): SearchResultRecord[] {
  return items.flatMap((item) => (item.type === "table" ? item.rows : [item]));
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

  return (
    <>
      {showSheet ? (
        <div
          id="phone-search-results"
          className="absolute right-0 bottom-full mb-2 max-h-[60dvh] w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-xl border bg-popover text-popover-foreground shadow-lg transition-[opacity,translate] duration-200 motion-reduce:transition-none starting:translate-y-2 starting:opacity-0"
        >
          {results.length > 0 ? (
            <ul aria-label="Search results" className="py-1">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.url}
                    onClick={onClose}
                    className="flex min-h-tap flex-col justify-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none"
                  >
                    <span className={result.type === "page" ? "font-medium" : "text-muted-foreground"}>{result.content}</span>
                    {result.breadcrumbs && result.breadcrumbs.length > 0 ? (
                      <span className="text-xs text-muted-foreground">{result.breadcrumbs.join(" › ")}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
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
        aria-controls={showSheet ? "phone-search-results" : undefined}
        placeholder="Search the docs"
        className="h-full min-w-0 flex-1 bg-transparent pl-4 text-field text-foreground placeholder:text-muted-foreground focus:outline-none"
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
 * Phone search: a round magnifier at the bottom-right that stretches left into a pill
 * (the magnifier stays its right end), lifts above the software keyboard, and shows
 * results in a sheet above the pill.
 */
export function SearchPill() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lifted = useRef<HTMLDivElement>(null);
  useKeyboardLift(open, lifted);

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
    <div className="md:hidden">
      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-overlay cursor-default bg-overlay/30 transition-opacity duration-200 motion-reduce:transition-none starting:opacity-0"
        />
      ) : null}
      <div
        ref={lifted}
        className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-overlay flex justify-end"
      >
        <div
          role="search"
          className={`relative flex h-tap items-center justify-end rounded-full bg-popover text-popover-foreground shadow-lg ring-1 ring-border transition-[width] duration-300 ease-out motion-reduce:transition-none ${
            open ? "w-[calc(100vw-2rem)]" : "w-tap"
          }`}
        >
          {open ? <PillBody onClose={() => setOpen(false)} /> : null}
          <button
            type="button"
            aria-label="Search the documentation"
            aria-expanded={open}
            onClick={() => (open ? document.querySelector<HTMLInputElement>("#nd-search-pill-input")?.focus() : setOpen(true))}
            className={`${iconButtonClassName} bg-primary text-primary-foreground active:scale-95 motion-reduce:transition-none`}
          >
            <Search aria-hidden="true" className="size-icon-control" />
          </button>
        </div>
      </div>
    </div>
  );
}
