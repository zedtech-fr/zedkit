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

export { applyCustomIdentityCss, clearCustomIdentitySheet };
