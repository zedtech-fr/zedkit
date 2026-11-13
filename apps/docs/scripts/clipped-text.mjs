/** Pure clipped-text check for UI DoD v2. Metrics in, hits out. No Playwright.
 * `allowClip` is `data-allow-clip`; register the node in CLIP_EXCEPTIONS.
 * Visually-hidden (sr-only, clip/clip-path hide, 1×1 boxes) is not a hit. */

const SKIP_TAGS = new Set(["HTML", "BODY", "PRE", "CODE", "INPUT", "TEXTAREA", "SELECT"]);
const SCROLL = new Set(["auto", "scroll"]);
const CLIP = new Set(["hidden", "clip"]);
const SR_ONLY = /(?:^|\s)sr-only(?:\s|$)/u;
const CLIP_RECT_ZERO = /^rect\((?:0|0px),(?:0|0px),(?:0|0px),(?:0|0px)\)$/u;
const CLIP_PATH_HIDE = /^(?:inset\((?:50%|100%)(?:(?:50%|100%)){0,3}\)|circle\(0(?:px)?\))$/u;

function intendedTruncate(el) {
  if (el.allowClip) return true;
  const cls = el.className ?? "";
  if (/(?:^|\s)truncate(?:\s|$)/u.test(cls)) return true;
  if (/(?:^|\s)line-clamp-/u.test(cls)) return true;
  const clamp = Number.parseFloat(el.lineClamp);
  return Number.isFinite(clamp) && clamp > 0;
}

function intendedScroll(el) {
  if (SCROLL.has(el.overflowX) || SCROLL.has(el.overflowY)) return true;
  // Radix ScrollArea viewport keeps overflow:hidden and still scrolls.
  return Boolean(el.scrollViewport);
}

function visuallyHidden(el) {
  if ((el.clientWidth ?? 0) <= 1 && (el.clientHeight ?? 0) <= 1) return true;
  if (SR_ONLY.test(el.className ?? "")) return true;
  const clip = (el.clip ?? "").replace(/\s+/gu, "").toLowerCase();
  if (CLIP_RECT_ZERO.test(clip)) return true;
  const clipPath = (el.clipPath ?? "").replace(/\s+/gu, "").toLowerCase();
  return CLIP_PATH_HIDE.test(clipPath);
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
 *   lineClamp?: string | number,
 *   clip?: string,
 *   clipPath?: string,
 *   scrollWidth?: number,
 *   clientWidth?: number,
 *   scrollHeight?: number,
 *   clientHeight?: number,
 *   allowClip?: boolean,
 *   scrollViewport?: boolean,
 * }>} elements
 */
export function clippedTextHits(elements) {
  const hits = [];
  for (const el of elements) {
    const tag = (el.tag ?? "").toUpperCase();
    if (SKIP_TAGS.has(tag)) continue;
    if (visuallyHidden(el)) continue;
    if (intendedScroll(el)) continue;
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
