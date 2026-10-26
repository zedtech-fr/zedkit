import Link from "next/link";
import { Badge } from "@zedtech/zedkit-ui";
import { maturityDocHref } from "@/content/maturity-compatibility";
import { maturityBadgeVariant } from "@/lib/maturity-status";

export function MaturityBadge({ status }: { status: string }) {
  return (
    <Badge asChild variant={maturityBadgeVariant(status)}>
      <Link href={maturityDocHref}>{status}</Link>
    </Badge>
  );
}
