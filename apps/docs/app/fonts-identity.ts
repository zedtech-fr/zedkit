/*
 * Non-default identity families (Fontsource side effects). Loaded after first
 * paint so cold `/` does not parse extra @font-face sheets (#618).
 * Space Grotesk is NOT here: it is the default identity's display face and
 * ships in the critical path (`fonts.ts`) so the home heading never reflows.
 */
import "@fontsource-variable/jost";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/cormorant";
