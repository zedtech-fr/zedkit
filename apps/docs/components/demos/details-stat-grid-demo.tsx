import { DetailPanel } from "@zedtech/zedkit-ui";
import { detailsCopy } from "@/components/demos/i18n/details-copy";

/** Dashboard-style stats from the same detail items. */
export function DetailsStatGridDemo() {
  return <DetailPanel variant="grid" items={[...detailsCopy.statGrid.items]} />;
}
