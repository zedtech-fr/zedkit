/** Shared by the closed pill (keyboard resize) and the open body (results sheet). Kept out of the search-client module so first-load JS stays small. */
export const SEARCH_PILL_SHEET_ID = "phone-search-results";

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
export function fitSearchPillSheet() {
  const sheet = document.getElementById(SEARCH_PILL_SHEET_ID);
  const bar = sheet?.parentElement;
  if (!sheet || !bar) return;
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const height = viewport?.height ?? window.innerHeight;
  const room = top + height - bar.getBoundingClientRect().bottom - SHEET_BAR_GAP - SHEET_BOTTOM_MARGIN;
  sheet.style.maxHeight = `${Math.max(SHEET_MIN_HEIGHT, Math.floor(room))}px`;
}
