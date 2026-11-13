/** Pure clipped-text check for UI DoD v2. Metrics in, hits out. No Playwright.
 * `allowClip` is `data-allow-clip`; register the node in CLIP_EXCEPTIONS. */

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

function hitLocator(el) {
  const classSlice = (el.className ?? "").replace(/\s+/gu, " ").trim().slice(0, 60);
  const textSlice = (el.text ?? "").replace(/\s+/gu, " ").trim().slice(0, 40);
  return [classSlice, textSlice].filter(Boolean).join(" ").slice(0, 90);
}

function overflows(el) {
  return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
}

/**
 * @param {Array<{
 *   tag?: string,
 *   className?: string,
 *   text?: string,
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
    const locator = hitLocator(el);
    const wide = CLIP.has(el.overflowX) && el.scrollWidth > el.clientWidth + 1;
    const tall = CLIP.has(el.overflowY) && el.scrollHeight > el.clientHeight + 1;
    if (wide || tall) {
      hits.push({ kind: "overflow", tag, locator });
      continue;
    }
    if (el.textOverflow === "ellipsis" && overflows(el)) {
      hits.push({ kind: "ellipsis", tag, locator });
    }
  }
  return hits;
}
