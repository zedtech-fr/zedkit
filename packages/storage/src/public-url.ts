import type { StorageConfig } from "./config.js";
import { sanitizeObjectKey } from "./sanitize-key.js";

/** Build a public HTTPS URL when `publicBaseUrl` is configured (CDN or bucket website). */
export function buildPublicObjectUrl(config: StorageConfig, key: string): string {
  if (config.publicBaseUrl === undefined) {
    throw new Error("publicBaseUrl is not configured");
  }
  const objectKey = sanitizeObjectKey(key, config.keyPrefix);
  const base = config.publicBaseUrl.replace(/\/$/, "");
  const encoded = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${base}/${encoded}`;
}
