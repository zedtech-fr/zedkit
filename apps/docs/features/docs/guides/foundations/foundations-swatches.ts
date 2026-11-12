export const foundationsBandIds = ["color", "type"] as const;

export type FoundationsBandId = (typeof foundationsBandIds)[number];

export const foundationsSwatches = [
  { id: "page", token: "--zk-site-page", hex: "#FFFFFF", scope: "page" },
  { id: "band", token: "--zk-site-band", hex: "#FAFAFA", scope: "page" },
  { id: "hairline", token: "--zk-site-hairline", hex: "#E4E4E7", scope: "page" },
  { id: "body", token: "--muted-foreground", hex: "#4E4E56", scope: "page" },
  { id: "ink", token: "--foreground", hex: "#09090B", scope: "page" },
  { id: "action", token: "--zk-site-action", hex: "#18181B", scope: "page" },
  { id: "indigo", token: "--primary", hex: "#2B23C7", scope: "panel" },
  { id: "violet", token: "--accent", hex: "#A171F4", scope: "panel" },
] as const satisfies ReadonlyArray<{
  id: string;
  token: `--${string}`;
  hex: `#${string}`;
  scope: "page" | "panel";
}>;

export type FoundationsSwatch = (typeof foundationsSwatches)[number];

export const foundationsTypeRows = [
  { id: "display", treatment: "display" },
  { id: "section", treatment: "section" },
  { id: "band", treatment: "band" },
  { id: "lead", treatment: "lead" },
  { id: "quote", treatment: "quote" },
  { id: "mono", treatment: "mono" },
] as const;

export type FoundationsTypeRow = (typeof foundationsTypeRows)[number];
