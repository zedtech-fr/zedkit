/**
 * Identity a first-time visitor sees (nothing stored in localStorage).
 * The inline script in the root layout applies it before first paint, and the
 * choosers mark it as the default. A stored choice always wins. Swap this one
 * id (any id from `identities`) to change the default; "mist" is the soft look.
 */
export const DEFAULT_IDENTITY = "tide";
