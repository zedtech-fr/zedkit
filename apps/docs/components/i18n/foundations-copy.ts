/** English copy for the foundations specimen page. Keys only; no markup. */
export const foundationsCopy = {
  hero: {
    title: "Site foundations",
    intro:
      "White pages, zinc text, black actions. Color lives in panels, and glass sits on top of them.",
  },
  rules: {
    color:
      "Indigo and violet are the kit's own Glass tokens. On the site they appear inside panels and as small chips, never as page background or body text.",
    type: "Display is the site title. Docs articles stay on the docs H1. Prose is 15px at 64–72ch. Body is 14px. Dense UI has a 13px floor.",
    buttons:
      "Site chrome buttons are near-black by default. Apply .site-action when restyling those actions. Kit Button follows the specimen identity, including Glass indigo. Copy that pattern into your app; do not copy it onto this site's frame.",
    chips:
      "Chips are compact status or selection controls. Violet and glass accents belong on a high-value panel.",
    cards: "Site-owned glass cards may take sheen. Specimen grids stay flat.",
    rhythm: "4px base. Gaps between groups are 32–48px. Marketing bands are 64–96px.",
    motion:
      "Chrome uses named motions only. It does not invent durations. One hero entrance, one pausable illustration. Reduced motion shows the final state with no movement.",
  },
  swatches: {
    page: "Page",
    text: "Text",
    indigo: "Indigo",
    violet: "Violet",
    panelTitle: "Glass goes on a panel",
    panelBody: "Never on the white page. It needs color behind it to show.",
  },
  typeLabels: {
    display: "display",
    section: "section",
    band: "band",
    cardTitle: "cardTitle",
    lead: "lead",
    prose: "prose",
    body: "body",
    small: "small",
    label: "label",
    nav: "nav",
  },
  typeSamples: {
    display: "Code that's checked.",
    section: "Same idea, two places.",
    band: "zedkit UI",
    cardTitle: "Site buttons",
    lead: "White pages, zinc text, black actions.",
    prose: "A separate verifier reads the diff cold.",
    body: "Body copy is 14px.",
    small: "Dense UI has a 13px floor.",
    label: "Workspace",
    nav: "Catalog",
  },
  buttons: {
    siteTitle: "Site buttons",
    kitTitle: "Kit buttons, Glass look",
    sitePrimary: "Get started",
    siteSecondary: "Read the docs",
    siteLink: "Catalog",
    kitPrimary: "Save changes",
    kitSecondary: "Discard",
    kitDestructive: "Delete",
  },
  chips: {
    ai: "AI",
    ui: "UI",
    beta: "beta",
    active: "Active",
    blocked: "Blocked",
    selectQuiet: "Quiet",
    selectOn: "Selected",
  },
  field: {
    label: "Workspace",
    value: "Harbor Console",
  },
  rhythm: {
    tight: "tight",
    sm: "sm",
    md: "md",
    lg: "lg",
    blocks: "blocks",
    mark: "Gap",
  },
} as const;

export type FoundationsCopy = typeof foundationsCopy;
