import Link from "next/link";
import { Badge } from "@zedtech/zedkit-ui";
import { maturityDocHref } from "@/content/maturity-compatibility";

export function MaturityBadge({ status }: { status: string }) {
  return (
    <Badge asChild>
      <Link href={maturityDocHref} className="in-[:root:not([data-identity=mist])]:text-primary-foreground! in-[:root:not([data-identity=mist])]:no-underline">{status}</Link>
    </Badge>
  );
}
