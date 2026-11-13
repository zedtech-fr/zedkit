/**
 * Home page rhythm constants. Vertical section rhythm comes from the kit
 * section spacing scale (full-bleed bands); these constants cover the gaps
 * and card grids inside each band.
 */
export const HOME_SECTION_CONTENT_GAP = "list" as const;

/**
 * Same-idea cards: one column until `lg`, then three. Not an `md` pair and
 * not an `sm` pair / `xl` trio, because a phone must stack all three cards.
 */
export const HOME_SAME_IDEA_CARDS_GRID =
  "trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-trio";
/**
 * Six-sentences cards: one column until `lg`, then four. Featured cards
 * take `lg:span-rest` (two of four) so 1440 is featured | small | small,
 * then small | small | featured. Not an `sm` pair / `xl` quad, because a
 * phone must stack all six.
 */
export const HOME_SIX_SENTENCES_GRID =
  "trim-margin grid content-shrink list-none gap-stack-lg flush lg:grid-quad";
/**
 * Limits: one column until `lg`, then three. Not an `sm` pair / `xl` trio,
 * because a phone must stack all three items.
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
 * Fade-in because origin/limits/closing are reading; displacement fights the copy.
 */
export const HOME_READING_REVEAL_PROPS = { "data-animate": "fade-in" } as const;

/**
 * Hero glass wash and looks specimen: scroll-linked drift on a node that is not already entering.
 * Decorative-only: never an ancestor of a focusable control (hero pause stays still).
 */
export const HOME_PARALLAX_SCROLL_PROPS = { "data-animate-scroll": "parallax" } as const;

/** Persuasion copy on the home page (maps to `--zk-type-body-*`). */
export const HOME_PERSUASION_TEXT_CLASS = "text-home-persuasion";

/** Secondary counts and labels (maps to `--zk-type-label-*`). */
export const HOME_METADATA_TEXT_CLASS = "home-metadata-copy";

/** Home page scroll height budget at 390px: mockup air (~10027px) plus slack. */
export const HOME_MOBILE_PAGE_MAX_SCROLL_PX = 10200;

/** Marks a subtree whose section intros use the home persuasion scale on mobile. */
export const HOME_MARKETING_ROOT_PROPS = { "data-home-marketing": "" } as const;
