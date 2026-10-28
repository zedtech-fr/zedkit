import type { LucideIcon } from "lucide-react";
import { Bot, LayoutDashboard, Server, TrendingUp } from "lucide-react";

/** Lucide icon per home entry-point title (`apps/docs/home-entry-points.json`). */
export const DOMAIN_ICONS: Record<string, LucideIcon> = {
  "Build a UI": LayoutDashboard,
  "Core & server": Server,
  "Improve SEO": TrendingUp,
  "Set up coding agents": Bot,
};

export function domainIconFor(title: string): LucideIcon {
  const icon = DOMAIN_ICONS[title];
  if (!icon) throw new Error(`domain-icons: no icon mapped for "${title}"`);
  return icon;
}
