/*
 * Identity fonts, self-hosted from Fontsource (SIL OFL). Each import is a
 * side effect: it registers @font-face rules, and identities.css picks the
 * family per identity. The browser fetches a file only when a rendered
 * identity uses that family, and only the subsets the text needs.
 *
 * Default look (Geist) + code (JetBrains Mono) ship in the critical path.
 * Inter stays here too: the home page paints Mist/Tide/Glass scenes in the
 * first HTML, so loading it after paint shifts the pinned scroll height.
 * Other identity families load from `fonts-identity.ts` after hydration.
 */
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
