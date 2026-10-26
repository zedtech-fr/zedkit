import Link from "next/link";
import { Badge } from "@zedtech/zedkit-ui";
import { maturityDocHref } from "@/content/maturity-compatibility";
import { maturityBadgeVariant } from "@/lib/maturity-status";

export function MaturityBadge({ status }: { status: string }) {
  return (
    <Badge asChild variant={maturityBadgeVariant(status)} className="no-underline hover:no-underline">
      <Link href={maturityDocHref} data-badge-link="" className="inline-flex min-h-tap items-center px-badge-inline no-underline hover:no-underline">
        {status}
      </Link>
    </Badge>
  );
}
