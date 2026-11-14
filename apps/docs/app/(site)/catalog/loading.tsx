import { ListPageSkeleton } from "@zedtech/zedkit-ui";
import { catalogCopy } from "./_catalog/i18n/catalog-copy";

export default function Loading() {
  return (
    <div data-catalog-shell className="py-section-lg">
      <ListPageSkeleton label={catalogCopy.loading} />
    </div>
  );
}
