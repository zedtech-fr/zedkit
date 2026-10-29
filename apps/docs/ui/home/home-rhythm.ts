/** Home page vertical rhythm — Stack `gap` steps map to kit spacing tokens. */
export const HOME_PAGE_SECTION_GAP = 8;
export const HOME_SECTION_CONTENT_GAP = 4;
export const HOME_CARD_CONTENT_GAP = 3;

export const HOME_PAGE_SHELL_CLASS = "mx-auto w-full min-w-0 max-w-5xl px-card-padding py-8";
export const HOME_CARD_GRID_TWO_COL = "grid min-w-0 gap-4 md:grid-cols-2";
export const HOME_CARD_GRID_THREE_COL = "grid min-w-0 gap-4 md:grid-cols-3";

/** Soft enter animation; static when prefers-reduced-motion (kit motion tokens). */
export const HOME_SECTION_REVEAL_CLASS =
  "motion-safe:animate-[zk-fade-in_var(--motion-base)_var(--ease-enter)]";

/** Fixed-height hero preview slot so idle-loaded art does not shift page scroll (#618). */
export const HOME_HERO_PREVIEW_SHELL_CLASS =
  "pointer-events-none h-72 w-full shrink-0 overflow-hidden lg:h-80";

/** Reserved below-hero height (mobile export) so idle chunk load does not change scrollHeight (#618). */
export const HOME_BELOW_HERO_PLACEHOLDER_CLASS = "min-h-[5800px] w-full";
