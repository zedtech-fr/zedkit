/** localStorage key holding the chosen identity id. */
const IDENTITY_STORAGE_KEY = "zk-identity";
/** Identity applied when nothing is stored (the stock look). */
const DEFAULT_IDENTITY = "mist";
/** Window event fired after the identity attribute changes (switcher, tour). */
const IDENTITY_CHANGE_EVENT = "zk-identity-change";

type IdentityOption = {
  id: string;
  label: string;
  /** One line that says what the look is for (shown by `IdentityTour`). */
  description?: string;
  /** Font families the identity names, so `IdentityTour` can fetch them before it starts. */
  fonts?: readonly string[];
};

/** Identities shipped in `identities.css`. */
const identities: readonly IdentityOption[] = [
  { id: "mist", label: "Mist", description: "Calm and soft: the stock look." },
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

/**
 * Ids used before the identities were renamed. A stored legacy id is
 * mapped to its new id (and rewritten) by `IdentityScript`, so a
 * returning visitor keeps their choice.
 */
const legacyIdentityIds: Readonly<Record<string, string>> = {
  soft: "mist",
  "retro-square": "press",
  studio: "tide",
  deep: "volt",
  luxe: "maison",
  gilt: "maison",
};

type IdentityScriptProps = {
  /** Allowed ids; anything else stored is ignored. Default: built-in identities. */
  ids?: readonly string[];
  defaultIdentity?: string;
  storageKey?: string;
  /** Old id to new id, applied to a stored value. Default: the renamed built-ins. */
  legacyIds?: Readonly<Record<string, string>>;
};

/**
 * Inline script that sets `data-identity` on <html> before first paint,
 * so the stored identity never flashes. Render it once inside <head>
 * of the root layout. The html element needs `suppressHydrationWarning`.
 */
function IdentityScript({
  ids = identities.map((item) => item.id),
  defaultIdentity = DEFAULT_IDENTITY,
  storageKey = IDENTITY_STORAGE_KEY,
  legacyIds = legacyIdentityIds,
}: IdentityScriptProps) {
  const code = `(function(){var d=document.documentElement,a=${JSON.stringify(ids)},m=${JSON.stringify(legacyIds)},k=${JSON.stringify(storageKey)},v=${JSON.stringify(defaultIdentity)};try{var s=localStorage.getItem(k);if(s&&Object.prototype.hasOwnProperty.call(m,s)){s=m[s];localStorage.setItem(k,s)}if(s&&a.indexOf(s)>-1)v=s}catch(e){}d.setAttribute("data-identity",v)})()`;
  return <script dangerouslySetInnerHTML={{ __html: code }} suppressHydrationWarning />;
}

export {
  DEFAULT_IDENTITY,
  IDENTITY_CHANGE_EVENT,
  IDENTITY_STORAGE_KEY,
  IdentityScript,
  identities,
  legacyIdentityIds,
  type IdentityOption,
  type IdentityScriptProps,
};
