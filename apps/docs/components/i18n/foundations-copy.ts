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
  },
  swatches: {
    page: "Page",
    band: "Band",
    hairline: "Hairline",
    body: "Body text",
    ink: "Ink",
    action: "Action",
    indigo: "Indigo",
    violet: "Violet",
    panelTitle: "Glass goes on a panel",
    panelBody: "Never on the white page. It needs color behind it to show.",
  },
  typeRows: {
    display: { spec: "Inter 48 / 1.08, medium", sample: "Code that's checked." },
    section: { spec: "Inter 30 / 1.15, medium", sample: "Same idea, two places." },
    band: { spec: "Inter 18, semibold", sample: "zedkit UI" },
    lead: { spec: "Inter 16 / 1.55", sample: "A separate verifier reads the diff cold." },
    quote: { spec: "Inter 20 italic, quotes only", sample: "“Looks good to me.”" },
    mono: {
      spec: "JetBrains Mono 13",
      sample: "Set up zedkit UI on this repo following https://zedkit.app/ui/setup.md",
    },
  },
} as const;

export type FoundationsCopy = typeof foundationsCopy;
