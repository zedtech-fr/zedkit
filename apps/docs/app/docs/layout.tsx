import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "#source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} nav={{ title: "zedkit" }}>
      {children}
    </DocsLayout>
  );
}
