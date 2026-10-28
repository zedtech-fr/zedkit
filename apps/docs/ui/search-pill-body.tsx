"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStaticSearch, type SearchResultRecord } from "fumadocs-core/search/client";
import { X } from "lucide-react";
import { SEARCH_PILL_SHEET_ID, fitSearchPillSheet } from "@/ui/search-pill-fit";

const iconButtonClassName =
  "inline-flex min-h-[max(2.75rem,44px)] min-w-[max(2.75rem,44px)] flex-none items-center justify-center rounded-full focus-ring-control";

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

function SearchPillResults({
  results,
  isLoading,
  onClose,
}: {
  results: SearchResultRecord[];
  isLoading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      id={SEARCH_PILL_SHEET_ID}
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
  );
}

/** Search field and results. Mounted only while open, so the index is fetched on demand. */
export function SearchPillBody({ onClose }: { onClose: () => void }) {
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
    document.getElementById(SEARCH_PILL_SHEET_ID)?.scrollTo({ top: 0 });
    fitSearchPillSheet();
  }, [search, showSheet, results.length, isLoading]);

  // The pill can change height after the sheet is sized (fonts arriving, a wrapped hint): follow it.
  useEffect(() => {
    const anchor = document.getElementById(SEARCH_PILL_SHEET_ID)?.parentElement;
    if (!anchor || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fitSearchPillSheet);
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [showSheet]);

  return (
    <>
      {showSheet ? <SearchPillResults results={results} isLoading={isLoading} onClose={onClose} /> : null}
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
        aria-controls={showSheet ? SEARCH_PILL_SHEET_ID : undefined}
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
