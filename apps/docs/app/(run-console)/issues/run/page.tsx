import { liveConsoleCopy, ReviewLiveConsoleSearchFeature } from "@/features/reviews";
import { docsPageMetadata } from "@/lib/docs-metadata";

export const dynamic = "force-static";

export const metadata = docsPageMetadata("/issues/run", liveConsoleCopy.metadata, { index: false });

export default function PublicLiveRunPage() {
  return <ReviewLiveConsoleSearchFeature />;
}
