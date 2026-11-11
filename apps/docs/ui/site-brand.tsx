import { Logo } from "@zedtech/zedkit-ui";
import { siteChromeCopy } from "@/ui/i18n/site-chrome-copy";

/** Header brand: the mark (decorative, the name sits beside it) and the wordmark. */
export function SiteBrand() {
  return (
    <>
      <Logo title="" className="h-brand text-foreground" />
      <span>{siteChromeCopy.brand.name}</span>
    </>
  );
}
