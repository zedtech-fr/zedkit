"use client";

import * as React from "react";

/** localStorage key holding the chosen identity id. */
const IDENTITY_STORAGE_KEY = "zk-identity";
/** Window event fired after the identity attribute changes. */
const IDENTITY_CHANGE_EVENT = "zk-identity-change";

type IdentityOption = {
  id: string;
  label: string;
  /** One line that says what the look is for. */
  description?: string;
  /** Font families the identity names, so a preview can fetch them before it starts. */
  fonts?: readonly string[];
};

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

type IdentityScriptProps = {
  /** Allowed ids; anything else stored is ignored. Default: built-in identities. */
  ids?: readonly string[];
  /** Applied when nothing valid is stored. Without it, the attribute is left unset (stock look). */
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
  defaultIdentity,
  storageKey = IDENTITY_STORAGE_KEY,
}: IdentityScriptProps) {
  const code = `(function(){var d=document.documentElement,a=${JSON.stringify(ids)},k=${JSON.stringify(storageKey)},v=${JSON.stringify(defaultIdentity ?? null)};try{var s=localStorage.getItem(k);if(s&&a.indexOf(s)>-1)v=s}catch(e){}if(v)d.setAttribute("data-identity",v)})()`;
  return <script data-slot="identity-script" dangerouslySetInnerHTML={{ __html: code }} suppressHydrationWarning />;
}

/**
 * Sets `data-identity` on <html>, stores the choice and notifies every
 * mounted switcher. Tokens follow through CSS; no component re-renders.
 */
function applyIdentity(id: string, storageKey: string = IDENTITY_STORAGE_KEY) {
  document.documentElement.setAttribute("data-identity", id);
  window.localStorage.setItem(storageKey, id);
  window.dispatchEvent(new Event(IDENTITY_CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(IDENTITY_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(IDENTITY_CHANGE_EVENT, callback);
  };
}

/** Current `data-identity` of <html> (or the fallback), kept in sync across switchers and tabs. */
function useIdentity(fallback = ""): string {
  return React.useSyncExternalStore(
    subscribe,
    () => document.documentElement.getAttribute("data-identity") ?? fallback,
    () => fallback,
  );
}

export {
  IDENTITY_CHANGE_EVENT,
  IDENTITY_STORAGE_KEY,
  IdentityScript,
  applyIdentity,
  identities,
  useIdentity,
  type IdentityOption,
  type IdentityScriptProps,
};
