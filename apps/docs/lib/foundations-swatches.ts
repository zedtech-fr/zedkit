export const foundationsBandIds = [
  "color",
  "type",
  "buttons",
  "chips",
  "cards",
  "rhythm",
  "motion",
] as const;

export type FoundationsBandId = (typeof foundationsBandIds)[number];

export const foundationsSwatchAllowlist = [
  "bg-background",
  "bg-foreground",
  "bg-primary",
  "bg-accent",
] as const;

export type FoundationsSwatchToken = (typeof foundationsSwatchAllowlist)[number];

export const foundationsSwatches = [
  { id: "page", tokenClass: "bg-background", scope: "page" },
  { id: "text", tokenClass: "bg-foreground", scope: "page" },
  { id: "indigo", tokenClass: "bg-primary", scope: "panel" },
  { id: "violet", tokenClass: "bg-accent", scope: "panel" },
] as const satisfies ReadonlyArray<{
  id: string;
  tokenClass: FoundationsSwatchToken;
  scope: "page" | "panel";
}>;

export type FoundationsSwatch = (typeof foundationsSwatches)[number];

export const foundationsTypeRoles = [
  "display",
  "section",
  "band",
  "cardTitle",
  "lead",
  "prose",
  "body",
  "small",
  "label",
  "nav",
] as const;

export type FoundationsTypeRole = (typeof foundationsTypeRoles)[number];

export const foundationsMotionNames = [
  "reveal",
  "settle",
  "emphasis",
  "glide",
  "feedback",
] as const;

export type FoundationsMotionName = (typeof foundationsMotionNames)[number];
