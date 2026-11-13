import type { Metadata } from "next";

import { notFoundCopy } from "@/app/_not-found/i18n/not-found-copy";
import { docsPageMetadata } from "@/lib/docs-metadata";
import { NotFoundView } from "@/app/_not-found/not-found-view";
import { SiteLayout } from "@/components/site-chrome/site-layout";

export const metadata: Metadata = docsPageMetadata(
  "/404",
  {
    title: notFoundCopy.metadata.title,
    description: notFoundCopy.metadata.description,
  },
  { index: false },
);

export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundView />
    </SiteLayout>
  );
}
