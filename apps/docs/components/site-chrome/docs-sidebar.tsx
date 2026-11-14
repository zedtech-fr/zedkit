"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Stack,
  cn,
} from "@zedtech/zedkit-ui";
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
import { siteChromeCopy } from "@/components/site-chrome/i18n/site-chrome-copy";

const itemClassName =
  "flex min-h-target w-full items-center gap-stack-sm rounded-md px-control-inline text-left text-dense text-muted-foreground hover:ghost-hover hover:text-foreground data-[active=true]:muted-wash data-[active=true]:font-medium data-[active=true]:text-foreground [&_[data-icon]]:ms-auto [&_[data-icon]]:shrink-0";

function DocsSidebarItem({ className, ...props }: ComponentProps<typeof SidebarItem>) {
  return <SidebarItem className={cn(itemClassName, className)} {...props} data-docs-tree-item="" />;
}

function DocsSidebarFolderTrigger({
  className,
  ...props
}: ComponentProps<typeof SidebarFolderTrigger>) {
  return (
    <SidebarFolderTrigger
      className={cn(itemClassName, "font-medium", className)}
      {...props}
      data-docs-tree-item=""
    />
  );
}

function DocsSidebarFolderLink({ className, ...props }: ComponentProps<typeof SidebarFolderLink>) {
  return (
    <SidebarFolderLink
      className={cn(itemClassName, "font-medium", className)}
      {...props}
      data-docs-tree-item=""
    />
  );
}

function DocsSidebarFolderContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SidebarFolderContent>) {
  return (
    <SidebarFolderContent className={className} {...props}>
      <Stack gap="tight" className="pl-control-inline">
        {children}
      </Stack>
    </SidebarFolderContent>
  );
}

function DocsSidebarSeparator({ className, ...props }: ComponentProps<typeof SidebarSeparator>) {
  return (
    <SidebarSeparator
      className={cn(
        "mb-stack px-control-inline text-caption font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

const PageTree = createPageTreeRenderer({
  SidebarFolder,
  SidebarFolderContent: DocsSidebarFolderContent,
  SidebarFolderLink: DocsSidebarFolderLink,
  SidebarFolderTrigger: DocsSidebarFolderTrigger,
  SidebarItem: DocsSidebarItem,
  SidebarSeparator: DocsSidebarSeparator,
});

function DocsPageTree({ components }: { components?: Partial<SidebarPageTreeComponents> }) {
  return (
    <SidebarViewport>
      <PageTree {...components} />
    </SidebarViewport>
  );
}

type DocsSidebarProps = ComponentProps<"aside"> & {
  components?: Partial<SidebarPageTreeComponents>;
  banner?: ReactNode;
  footer?: ReactNode;
  collapsible?: boolean;
};

/**
 * Métier: public TypeScript kit documentation site.
 * Client personas: integrating developers who own the consuming app.
 * Customers: those same developers (this site is the product surface).
 * Customer personas: hurried first visit on a 390px phone — next action is the article, not a full-screen dump of package links; at 1440, a sidebar they can scan.
 * UI decisions: page tree in a kit Drawer below `md` because customer = phone reader who needs the heading on the first screen; trigger is a text control in the docs shell, not the site Menu, because those are different jobs; kit flex + `min-h-target` on items because chevrons and 24px targets are the defect; UI job-group separators stay because #113 already grouped them.
 *
 * Desktop `#nd-sidebar` stays mounted (Fumadocs `SidebarContent` would unmount it below md).
 * The drawer clone has no id. Foundations unmounts this module (`sidebar.enabled: false`).
 */
export function DocsSidebar({ className, components = {} }: DocsSidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        data-sidebar-placeholder=""
        className="sticky top-(--fd-docs-row-1) z-header [grid-area:sidebar] max-md:hidden"
      >
        <aside id="nd-sidebar" className={cn("flex w-full flex-col", className)}>
          <DocsPageTree components={components} />
        </aside>
      </div>
      <div
        data-docs-nav-trigger=""
        className="border-b px-page-gutter py-control-block [grid-area:sidebar] md:hidden"
      >
        <Drawer direction="left" mobile="side" open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" className="min-h-target">
              {siteChromeCopy.nav.docsPages}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="bg-sidebar text-sidebar-foreground">
            <DrawerHeader>
              <Stack direction="horizontal" gap="sm" className="items-center justify-between">
                <DrawerTitle>{siteChromeCopy.nav.docsNavigation}</DrawerTitle>
                <DrawerCloseButton />
              </Stack>
            </DrawerHeader>
            <DrawerBody
              tabIndex={0}
              className="focus-ring"
              onClick={(event) => {
                const node = event.target;
                if (!(node instanceof Node)) return;
                const el = node instanceof Element ? node : node.parentElement;
                if (el?.closest("a")) setOpen(false);
              }}
            >
              <DocsPageTree components={components} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
