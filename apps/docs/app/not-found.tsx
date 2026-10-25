import type { Metadata } from "next";

import { docsPageMetadata } from "@/lib/docs-metadata";
import { NotFoundView } from "@/ui/not-found/not-found-view";

export const metadata: Metadata = docsPageMetadata(
  "/404",
  {
    title: "Page not found",
    description: "This URL is not part of the zedkit docs site.",
  },
  { index: false },
);

export default function NotFound() {
  return <NotFoundView />;
}
