/** Pure clipped-text check for UI DoD v2. Metrics in, hits out. No Playwright. */

const SKIP_TAGS = new Set(["HTML", "BODY", "PRE", "CODE"]);
const SCROLL = new Set(["auto", "scroll"]);
const CLIP = new Set(["hidden", "clip"]);

function intendedTruncate(el) {
  if (el.allowClip) return true;
  const cls = el.className ?? "";
  if (/(?:^|\s)truncate(?:\s|$)/u.test(cls)) return true;
  if (/(?:^|\s)line-clamp-/u.test(cls)) return true;
  return false;
}

/**
 * @param {Array<{
 *   tag?: string,
 *   className?: string,
 *   overflowX?: string,
 *   overflowY?: string,
 *   textOverflow?: string,
 *   scrollWidth?: number,
 *   clientWidth?: number,
 *   scrollHeight?: number,
 *   clientHeight?: number,
 *   allowClip?: boolean,
 * }>} elements
 */
export function clippedTextHits(elements) {
  const hits = [];
  for (const el of elements) {
    const tag = (el.tag ?? "").toUpperCase();
    if (SKIP_TAGS.has(tag)) continue;
    if (SCROLL.has(el.overflowX) || SCROLL.has(el.overflowY)) continue;
    if (intendedTruncate(el)) continue;
    const wide = CLIP.has(el.overflowX) && el.scrollWidth > el.clientWidth + 1;
    const tall = CLIP.has(el.overflowY) && el.scrollHeight > el.clientHeight + 1;
    if (wide || tall) {
      hits.push({ kind: "overflow", tag });
      continue;
    }
    if (el.textOverflow === "ellipsis") {
      hits.push({ kind: "ellipsis", tag });
    }
  }
  return hits;
}
