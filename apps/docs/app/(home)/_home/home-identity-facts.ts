/** The looks the home page shows, one product screen restyled. Kept in step with `packages/ui/src/identities*.css`. */

export const IDENTITY_IDS = ["glass", "mist", "press", "maison"] as const;

export type IdentityId = (typeof IDENTITY_IDS)[number];

export type IdentityFacts = {
  id: IdentityId;
  label: string;
  type: string;
  shape: string;
};

export const HOME_IDENTITY_FACTS: Record<IdentityId, IdentityFacts> = {
  glass: { id: "glass", label: "Glass", type: "Space Grotesk over Inter", shape: "1.25rem radius, 0.5px border" },
  mist: { id: "mist", label: "Mist", type: "Inter", shape: "0.5rem radius, 1px border" },
  press: { id: "press", label: "Press", type: "Newsreader over Space Grotesk", shape: "square corners, 1px rules" },
  maison: { id: "maison", label: "Maison", type: "Cormorant over Jost", shape: "2px radius, generous spacing" },
};

export function isIdentityId(value: string): value is IdentityId {
  return IDENTITY_IDS.includes(value as IdentityId);
}
