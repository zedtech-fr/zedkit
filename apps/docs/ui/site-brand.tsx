import { Logo } from "@zedtech/zedkit-ui";

/** Header brand: the mark (decorative, the name sits beside it) and the wordmark. */
export function SiteBrand() {
  return (
    <>
      <Logo title="" className="h-5 text-foreground" />
      <span>zedkit</span>
    </>
  );
}
