/*
 * Identity fonts, self-hosted from Fontsource (SIL OFL). Each import is a
 * side effect: it registers @font-face rules, and identities.css picks the
 * family per identity. The browser fetches a file only when a rendered
 * identity uses that family, and only the subsets the text needs.
 *
 * Default look (Inter) + code (JetBrains Mono) ship in the critical path.
 * Geist stays here too: a saved Volt choice and the home scenes that use it
 * must not shift when the file arrives.
 * Other identity families load from `fonts-identity.ts` after hydration.
 */
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
