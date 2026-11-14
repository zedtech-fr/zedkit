import { DocsPageSkeleton } from "@zedtech/zedkit-ui";
import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";

export default function Loading() {
  return (
    <div id="main-content" tabIndex={-1} className="content-shrink [grid-area:main]">
      <DocsPageSkeleton label={siteChromeCopy.loading.page} />
    </div>
  );
}
