import type { ReactNode } from "react";
import { source } from "#source";
import { DocsLayoutBranch } from "@/ui/docs-layout-branch";

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayoutBranch tree={source.pageTree}>{children}</DocsLayoutBranch>;
}
