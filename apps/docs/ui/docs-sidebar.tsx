"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@zedtech/zedkit-ui";
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarSeparator,
  SidebarViewport,
} from "fumadocs-ui/components/sidebar/base";
import {
  createPageTreeRenderer,
  type SidebarPageTreeComponents,
} from "fumadocs-ui/components/sidebar/page-tree";

const PageTree = createPageTreeRenderer({
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarSeparator,
});

type DocsSidebarProps = ComponentProps<"aside"> & {
  components?: Partial<SidebarPageTreeComponents>;
  banner?: ReactNode;
  footer?: ReactNode;
  collapsible?: boolean;
};

/**
 * Always-on page tree. Fumadocs `SidebarContent` unmounts `#nd-sidebar` below
 * md (`mode === "drawer"`), so CSS cannot restack it into the phone flow.
 */
export function DocsSidebar({ className, components = {} }: DocsSidebarProps) {
  return (
    <div data-sidebar-placeholder="" className="sticky top-(--fd-docs-row-1) z-header [grid-area:sidebar]">
      <aside id="nd-sidebar" className={cn("flex w-full flex-col", className)}>
        <SidebarViewport>
          <PageTree {...components} />
        </SidebarViewport>
      </aside>
    </div>
  );
}
