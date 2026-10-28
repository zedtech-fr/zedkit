"use client";

import * as React from "react";

import {
  IDENTITY_CHANGE_EVENT,
  IDENTITY_STORAGE_KEY,
  identities,
  type IdentityOption,
} from "./identity-data.js";

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
  applyIdentity,
  identities,
  useIdentity,
  type IdentityOption,
};
