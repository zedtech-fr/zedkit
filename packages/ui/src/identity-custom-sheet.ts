import {
  IDENTITY_CUSTOM_SHEET_SLOT,
  IDENTITY_STORAGE_KEY,
  customIdentityStorageKey,
} from "./identity-data.js";

function customSheet(doc: Document): HTMLStyleElement {
  const existing = doc.querySelector(`style[data-slot="${IDENTITY_CUSTOM_SHEET_SLOT}"]`);
  if (existing instanceof HTMLStyleElement) return existing;
  const sheet = doc.createElement("style");
  sheet.setAttribute("data-slot", IDENTITY_CUSTOM_SHEET_SLOT);
  (doc.head ?? doc.documentElement).append(sheet);
  return sheet;
}

function applyCustomIdentityCss(
  css: string,
  storageKey: string = IDENTITY_STORAGE_KEY,
  doc: Document = document,
): HTMLStyleElement {
  doc.defaultView?.localStorage.setItem(customIdentityStorageKey(storageKey), css);
  const sheet = customSheet(doc);
  sheet.textContent = css;
  return sheet;
}

function clearCustomIdentitySheet(storageKey: string = IDENTITY_STORAGE_KEY, doc: Document = document): void {
  doc.defaultView?.localStorage.removeItem(customIdentityStorageKey(storageKey));
  const sheet = doc.querySelector(`style[data-slot="${IDENTITY_CUSTOM_SHEET_SLOT}"]`);
  if (sheet) sheet.textContent = "";
}

/**
 * Mirrors the stored custom CSS into the live sheet. Sheets are scoped to
 * one look (`:root[data-identity="…"]`), so a parked sheet is inert under
 * other looks and active again on switch-back — the same state the boot
 * script restores after a reload.
 */
function syncCustomIdentitySheet(storageKey: string = IDENTITY_STORAGE_KEY, doc: Document = document): void {
  const css = doc.defaultView?.localStorage.getItem(customIdentityStorageKey(storageKey));
  if (!css) {
    const sheet = doc.querySelector(`style[data-slot="${IDENTITY_CUSTOM_SHEET_SLOT}"]`);
    if (sheet) sheet.textContent = "";
    return;
  }
  customSheet(doc).textContent = css;
}

export { applyCustomIdentityCss, clearCustomIdentitySheet, syncCustomIdentitySheet };
