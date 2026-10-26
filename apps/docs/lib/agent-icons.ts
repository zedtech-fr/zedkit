import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BadgeCheck,
  Blocks,
  BookOpenText,
  FlaskConical,
  Layers,
  PackageSearch,
  Palette,
  PenLine,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Tag,
  Target,
  Telescope,
  TrendingUp,
  Wrench,
} from "lucide-react";

/** Lucide icon per kit agent id (packages/ai/kit/kit.json). */
export const AGENT_ICONS: Record<string, LucideIcon> = {
  explorer: Search,
  architect: Blocks,
  "plan-challenger": ShieldQuestion,
  verifier: BadgeCheck,
  improver: Wrench,
  "security-reviewer": ShieldCheck,
  skeptic: ShieldQuestion,
  "ui-designer": Palette,
  copywriter: PenLine,
  "seo-auditor": TrendingUp,
  "a11y-auditor": Accessibility,
  "dependency-auditor": PackageSearch,
  "docs-writer": BookOpenText,
  researcher: Telescope,
  "test-writer": FlaskConical,
  "release-manager": Tag,
  "console-architecture": Layers,
  "product-director": Target,
};

export function agentIconFor(name: string): LucideIcon {
  const icon = AGENT_ICONS[name];
  if (!icon) throw new Error(`agent-icons: no icon mapped for "${name}"`);
  return icon;
}
