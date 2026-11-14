import { DetailPageSkeleton } from "@zedtech/zedkit-ui";
import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";

export default function Loading() {
  return <DetailPageSkeleton label={siteChromeCopy.loading.issue} />;
}
