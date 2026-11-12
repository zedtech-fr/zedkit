import Link from "next/link";
import type { ComponentProps } from "react";

/** Home marketing links skip App Router prefetch so in-view bands do not queue RSC payloads on first paint. */
export function HomeLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
