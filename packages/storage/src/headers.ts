/** Long-lived cache for fingerprinted assets (immutable). */
export function immutableCacheControl(): string {
  return "public, max-age=31536000, immutable";
}

/** Recommended headers when serving user-uploaded SVG from object storage. */
export function svgServingHeaders(): Record<string, string> {
  return {
    "Content-Type": "image/svg+xml",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "X-Content-Type-Options": "nosniff",
  };
}
