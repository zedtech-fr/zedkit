import type { LucideIcon } from "lucide-react";
import { Bot, LayoutDashboard, Server, TrendingUp } from "lucide-react";

/** Lucide icon per catalog area id (`CatalogArea` in the generated index). */
export const AREA_ICONS = {
  ui: LayoutDashboard,
  backend: Server,
  seo: TrendingUp,
  agents: Bot,
} as const;

export function areaIconFor(id: keyof typeof AREA_ICONS): LucideIcon {
  const icon = AREA_ICONS[id];
  if (!icon) throw new Error(`domain-icons: no area icon mapped for "${id}"`);
  return icon;
}
