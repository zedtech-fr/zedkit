type IdentityOption = {
  id: string;
  label: string;
  /** One line that says what the look is for. */
  description?: string;
  /** Font families the identity names, so a preview can fetch them before it starts. */
  fonts?: readonly string[];
};

/** localStorage key holding the chosen identity id. */
const IDENTITY_STORAGE_KEY = "zk-identity";
/** Window event fired after the identity attribute changes. */
const IDENTITY_CHANGE_EVENT = "zk-identity-change";

/**
 * Identities shipped in `identities.css`, offered by default by
 * `IdentityScript`, `IdentitySwitcher` and `IdentityPicker`. Pass your own
 * list (ids matching your `[data-identity]` CSS) to offer other looks.
 */
const identities: readonly IdentityOption[] = [
  {
    id: "mist",
    label: "Mist",
    description: "Calm and soft: the everyday look.",
    fonts: ["Inter Variable"],
  },
  {
    id: "press",
    label: "Press",
    description: "Editorial: ink on paper, fine rules, serif titles.",
    fonts: ["Space Grotesk Variable", "Newsreader Variable", "JetBrains Mono Variable"],
  },
  {
    id: "tide",
    label: "Tide",
    description: "Navy and coral: bold, round, lively.",
    fonts: ["Inter Variable", "JetBrains Mono Variable"],
  },
  {
    id: "volt",
    label: "Volt",
    description: "Dense and dark: one electric accent.",
    fonts: ["Geist Variable", "JetBrains Mono Variable"],
  },
  {
    id: "maison",
    label: "Maison",
    description: "Brand boutique: ivory, serif, airy.",
    fonts: ["Cormorant Variable", "Jost Variable", "JetBrains Mono Variable"],
  },
  {
    id: "glass",
    label: "Glass",
    description: "Frosted glass: translucent layers over soft colour.",
    fonts: ["Space Grotesk Variable", "Inter Variable", "JetBrains Mono Variable"],
  },
];

export {
  IDENTITY_CHANGE_EVENT,
  IDENTITY_STORAGE_KEY,
  identities,
  type IdentityOption,
};
