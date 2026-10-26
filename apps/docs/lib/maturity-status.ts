import type { BadgeProps } from "@zedtech/zedkit-ui";

export type MaturityBadgeVariant = NonNullable<BadgeProps["variant"]>;

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
