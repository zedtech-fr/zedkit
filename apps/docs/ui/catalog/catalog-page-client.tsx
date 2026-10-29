"use client";

import dynamic from "next/dynamic";
import type { CatalogIndexEntry } from "@/content/catalog-index";
import { Stack, Text } from "@zedtech/zedkit-ui";

const CatalogViewFromUrl = dynamic(
  () => import("@/ui/catalog/catalog-view").then((mod) => ({ default: mod.CatalogViewFromUrl })),
  {
    loading: () => (
      <Stack gap={8} className="mx-auto w-full max-w-5xl px-6 py-12">
        <Text variant="muted" role="status">
          Loading catalog…
        </Text>
      </Stack>
    ),
  },
);

export function CatalogPageClient({ entries }: { entries: CatalogIndexEntry[] }) {
  return <CatalogViewFromUrl entries={entries} />;
}
