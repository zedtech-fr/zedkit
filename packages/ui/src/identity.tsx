/** localStorage key holding the chosen identity id. */
const IDENTITY_STORAGE_KEY = "zk-identity";
/** Identity applied when nothing is stored (the stock look). */
const DEFAULT_IDENTITY = "soft";

type IdentityOption = { id: string; label: string };

/** Identities shipped in `identities.css`. */
const identities: readonly IdentityOption[] = [
  { id: "soft", label: "Soft" },
  { id: "retro-square", label: "Retro square" },
  { id: "studio", label: "Studio" },
  { id: "deep", label: "Deep" },
  { id: "luxe", label: "Luxe" },
];

type IdentityScriptProps = {
  /** Allowed ids; anything else stored is ignored. Default: built-in identities. */
  ids?: readonly string[];
  defaultIdentity?: string;
  storageKey?: string;
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
}: IdentityScriptProps) {
  const code = `(function(){var d=document.documentElement,a=${JSON.stringify(ids)},v=${JSON.stringify(defaultIdentity)};try{var s=localStorage.getItem(${JSON.stringify(storageKey)});if(s&&a.indexOf(s)>-1)v=s}catch(e){}d.setAttribute("data-identity",v)})()`;
  return <script dangerouslySetInnerHTML={{ __html: code }} suppressHydrationWarning />;
}

export { DEFAULT_IDENTITY, IDENTITY_STORAGE_KEY, IdentityScript, identities, type IdentityOption, type IdentityScriptProps };
