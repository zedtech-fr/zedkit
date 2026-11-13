/** English copy for the persistent shell / page transition demo. Keys only; no markup. */
export const pageTransitionCopy = {
  header: "Docs",
  sidebar: "On this page",
  installNav: "Install",
  tokensNav: "Tokens",
  install: "Add the package, then mount the shell in a shared layout so the next click keeps the header.",
  tokens: "Named settle and reveal motions switch off under reduced motion. Only the article moves.",
} as const;

export type PageTransitionCopy = typeof pageTransitionCopy;
