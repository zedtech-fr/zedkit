/*
 * Identity fonts, self-hosted from Fontsource (SIL OFL). Each import is a
 * side effect: it registers @font-face rules, and identities.css picks the
 * family per identity. The browser fetches a file only when a rendered
 * identity uses that family, and only the subsets the text needs.
 *
 * Default look (Geist) + code (JetBrains Mono) ship in the critical path;
 * other identity families load from `fonts-identity.ts` after hydration.
 */
import "@fontsource-variable/geist";
import "@fontsource-variable/jetbrains-mono";
