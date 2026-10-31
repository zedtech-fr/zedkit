/**
 * Home page rhythm constants. Vertical section rhythm comes from the kit
 * section spacing scale (full-bleed bands); these constants cover the gaps
 * and card grids inside each band.
 */
export const HOME_SECTION_CONTENT_GAP = 4;
export const HOME_CARD_CONTENT_GAP = 3;

export const HOME_CARD_GRID_TWO_COL = "grid min-w-0 gap-4 md:grid-cols-2";
/**
 * The two-step grids step at `sm`, not `md`: fumadocs' prebuilt CSS defines
 * its own `md:grid-cols-2` later in the shared utilities layer, which would
 * shadow the `xl` step on any element carrying both. Track counts are pinned
 * by the "home bands" e2e test in tests/home-layout.spec.ts.
 */
export const HOME_CARD_GRID_THREE_COL = "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3";
export const HOME_CARD_GRID_FOUR_COL = "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4";

/** Soft enter animation; static when prefers-reduced-motion (kit motion tokens). */
export const HOME_SECTION_REVEAL_CLASS =
  "motion-safe:animate-[zk-fade-in_var(--motion-base)_var(--ease-enter)]";

/** Fixed-height hero preview slot so idle-loaded art does not shift page scroll (#618). */
export const HOME_HERO_PREVIEW_SHELL_CLASS =
  "h-80 w-full shrink-0 overflow-hidden lg:h-96";

/** Persuasion copy on the home page (maps to `--zk-type-body-*`). */
export const HOME_PERSUASION_TEXT_CLASS = "text-home-persuasion";

/** Secondary counts and labels (maps to `--zk-type-label-*`). */
export const HOME_METADATA_TEXT_CLASS = "home-metadata-copy";

/** Card and band titles under the hero (maps to `--zk-type-h3-*`). */
export const HOME_CARD_TITLE_CLASS = "text-zk-type-h3";

/** Audit L2d: interactive demo should begin within ~1.5 phone screens of the home top. */
export const HOME_MOBILE_INTERACTIVE_DEMO_MAX_TOP_PX = 1270;

/** Audit L2 mobile: home page scroll height budget at 390px width (40% shorter vs audit baseline). */
export const HOME_MOBILE_PAGE_MAX_SCROLL_PX = 8000;

/** Marks a subtree whose section intros use the home persuasion scale on mobile. */
export const HOME_MARKETING_ROOT_PROPS = { "data-home-marketing": "" } as const;
