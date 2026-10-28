import type { LucideIcon } from "lucide-react";
import { Ban, Beaker, CircleCheck, CircleDashed, FlaskConical } from "lucide-react";
import type { BadgeProps } from "@zedtech/zedkit-ui";

export type MaturityBadgeVariant = NonNullable<BadgeProps["variant"]>;

const MATURITY_ICONS = {
  stable: CircleCheck,
  beta: FlaskConical,
  alpha: Beaker,
  planned: CircleDashed,
  deprecated: Ban,
} as const;

/** Catalog maturity strings → badge variants with readable contrast on kit tokens. */
export function maturityBadgeVariant(status: string): MaturityBadgeVariant {
  switch (status.toLowerCase()) {
    case "stable":
      return "success";
    case "beta":
      return "secondary";
    case "alpha":
      return "warning";
    case "planned":
      return "outline";
    case "deprecated":
      return "destructive";
    default:
      return "secondary";
  }
}

export function maturityIconFor(status: string): LucideIcon {
  const icon = MATURITY_ICONS[status.toLowerCase() as keyof typeof MATURITY_ICONS];
  if (!icon) throw new Error(`maturity-status: no icon mapped for "${status}"`);
  return icon;
}
