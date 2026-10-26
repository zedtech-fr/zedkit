import Link from "next/link";
import { Badge } from "@zedtech/zedkit-ui";
import { maturityDocHref } from "@/content/maturity-compatibility";

export function MaturityBadge({ status }: { status: string }) {
  return (
    <Badge asChild>
      <Link href={maturityDocHref} className="text-primary-foreground! no-underline">{status}</Link>
    </Badge>
  );
}
