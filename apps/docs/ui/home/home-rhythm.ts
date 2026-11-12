import { DOCS_TYPE_H3_CLASS } from "@/lib/docs-type-roles";

/**
 * Home page rhythm constants. Vertical section rhythm comes from the kit
 * section spacing scale (full-bleed bands); these constants cover the gaps
 * and card grids inside each band.
 */
export const HOME_SECTION_CONTENT_GAP = "list" as const;
export const HOME_CARD_CONTENT_GAP = "lg" as const;

export const HOME_CARD_GRID_TWO_COL = "grid content-shrink gap-stack-lg md:grid-pair";
/**
 * The two-step grids step at `sm`, not `md`: fumadocs' prebuilt CSS defines
 * its own `md:grid-cols-2` later in the shared utilities layer, which would
 * shadow the `xl` step on any element carrying both. Class strings are pinned
 * by apps/docs/scripts/home-bundle.test.mjs.
 */
export const HOME_CARD_GRID_THREE_COL = "grid content-shrink gap-stack-lg sm:grid-pair xl:grid-trio";
export const HOME_CARD_GRID_FOUR_COL = "grid content-shrink gap-stack-lg sm:grid-pair xl:grid-quad";
/**
 * Same-idea cards: one column until `lg`, then three. Not
 * `HOME_CARD_GRID_TWO_COL` (`md` pair) and not `HOME_CARD_GRID_THREE_COL`
 * (`sm` pair / `xl` trio), because a phone must stack all three cards.
 */
export const HOME_SAME_IDEA_CARDS_GRID =
  "trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-trio";
/**
 * Six-sentences cards: one column until `lg`, then four. Featured cards
 * take `lg:span-rest` (two of four) so 1440 is featured | small | small,
 * then small | small | featured. Not `HOME_CARD_GRID_FOUR_COL` (`sm` pair
 * / `xl` quad), because a phone must stack all six.
 */
export const HOME_SIX_SENTENCES_GRID =
  "trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-quad";
/**
 * Limits: one column until `lg`, then three. Not `HOME_CARD_GRID_THREE_COL`
 * (`sm` pair / `xl` trio), because a phone must stack all three items.
 */
export const HOME_LIMITS_GRID =
  "trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-trio";
/** Paste timeline: pair from `sm`, four across from `xl`. Own grid (single caller), kept next to the fade-down reveal. */
export const HOME_PASTE_TIMELINE_GRID =
  "trim-margin grid content-shrink list-none gap-stack-lg flush sm:grid-pair xl:grid-quad";
/**
 * Paste file listing: one column until `lg`, then AI | UI.
 * Gap is the hairline divider; padding lives on each column.
 */
export const HOME_PASTE_LANDS_GRID =
  "trim-margin grid content-shrink list-none flush lg:grid-pair";
/**
 * Looks switcher: one column until `lg`, then specimen | copy.
 * Copy sits first in the DOM (pills reachable on a phone); `lg:col-start-*`
 * places the specimen on the left from `lg`.
 */
export const HOME_LOOKS_GRID = "grid content-shrink gap-stack-lg lg:grid-pair";

/**
 * Card grids: fade-up children in order. Apply on the `ul`, never the Section.
 * Rise because a card grid should arrive in reading order, not drop into the band.
 */
export const HOME_CARD_GRID_REVEAL_PROPS = {
  "data-animate": "fade-up",
  "data-animate-stagger": "",
} as const;

/**
 * Paste timeline: slide from above. Apply on the timeline `ul` only.
 * Descend because these are facts under the heading, not a rising card grid.
 * Own constant (single caller) so the gate can pin fade-down against fade-up.
 */
export const HOME_PASTE_TIMELINE_REVEAL_PROPS = {
  "data-animate": "fade-down",
  "data-animate-stagger": "",
} as const;

/**
 * Reading bands: opacity only. Apply on the inner stack, never the Section.
 * Fade-in because manifesto/limits/closing are reading; displacement fights the copy.
 */
export const HOME_READING_REVEAL_PROPS = { "data-animate": "fade-in" } as const;

/**
 * Hero glass wash and looks specimen: scroll-linked drift on a node that is not already entering.
 * Decorative-only: never an ancestor of a focusable control (hero pause stays still).
 */
export const HOME_PARALLAX_SCROLL_PROPS = { "data-animate-scroll": "parallax" } as const;

/** Min-height hero preview slot while the demo chunk loads; grows with the specimen (no fixed clip). */
export const HOME_HERO_PREVIEW_SHELL_CLASS = "pane-shrink w-full content-shrink";

/** Bounded live preview inside home gallery cards (min height reserves space while lazy chunks load). */
export const HOME_GALLERY_PREVIEW_SHELL_CLASS =
  "w-full content-shrink overflow-hidden rounded-md border bg-background surface-pad-compact";

/** Persuasion copy on the home page (maps to `--zk-type-body-*`). */
export const HOME_PERSUASION_TEXT_CLASS = "text-home-persuasion";

/** Secondary counts and labels (maps to `--zk-type-label-*`). */
export const HOME_METADATA_TEXT_CLASS = "home-metadata-copy";

/** Card and band titles under the hero (maps to `--zk-type-h3-*`). */
export const HOME_CARD_TITLE_CLASS = DOCS_TYPE_H3_CLASS;

/** Factual micro-proof under CTAs (maps to `--zk-type-small-*`). */
export const HOME_SMALL_TEXT_CLASS = "text-zk-type-small";

/** Audit L2d: interactive demo should begin within ~1.5 phone screens of the home top. */
export const HOME_MOBILE_INTERACTIVE_DEMO_MAX_TOP_PX = 760;

/** Audit L2 mobile: home page scroll height budget at 390px width (40% shorter vs audit baseline). */
export const HOME_MOBILE_PAGE_MAX_SCROLL_PX = 8000;

/** Marks a subtree whose section intros use the home persuasion scale on mobile. */
export const HOME_MARKETING_ROOT_PROPS = { "data-home-marketing": "" } as const;
