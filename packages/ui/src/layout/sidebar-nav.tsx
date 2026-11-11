import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "../utils.js";

export interface SidebarNavItemProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  active?: boolean;
  status?: React.ReactNode;
  meta?: React.ReactNode;
  count?: React.ReactNode;
}

export interface SidebarNavGroupProps extends React.ComponentProps<"details"> {
  /** Accessible name of the group, rendered in the summary. */
  label: React.ReactNode;
}

type AsChildHostProps = {
  className?: string;
  children?: React.ReactNode;
};

function itemSlots(
  title: React.ReactNode,
  status: React.ReactNode | undefined,
  meta: React.ReactNode | undefined,
  count: React.ReactNode | undefined,
) {
  return (
    <>
      {status ? (
        <span data-slot="sidebar-nav-item-status" className="shrink-0" aria-hidden>
          {status}
        </span>
      ) : null}
      <span data-slot="sidebar-nav-item-title" className="content-shrink flex-1 truncate text-left">
        {title}
      </span>
      {meta || count ? (
        <span
          data-slot="sidebar-nav-item-trail"
          className="ml-auto flex shrink-0 items-center gap-stack-tight text-caption text-muted-foreground"
          aria-hidden
        >
          {meta}
          {count}
        </span>
      ) : null}
    </>
  );
}

function itemClassName(active: boolean, className: string | undefined) {
  return cn(
    "flex min-h-target w-full cursor-pointer items-center gap-stack-sm rounded-md px-control-inline text-left text-dense focus-ring-control hover:ghost-hover",
    active && "muted-wash",
    className,
  );
}

function SidebarNavItem({
  asChild = false,
  active = false,
  status,
  meta,
  count,
  className,
  children,
  ...props
}: SidebarNavItemProps) {
  const current = active ? "page" : undefined;

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<AsChildHostProps>;
    return React.cloneElement(child, {
      "aria-current": current,
      ...props,
      className: itemClassName(active, cn(child.props.className, className)),
      "data-slot": "sidebar-nav-item",
      "data-active": active ? "" : undefined,
      children: itemSlots(child.props.children, status, meta, count),
    } as AsChildHostProps);
  }

  return (
    <button
      type="button"
      data-slot="sidebar-nav-item"
      data-active={active ? "" : undefined}
      aria-current={current}
      className={itemClassName(active, className)}
      {...props}
    >
      {itemSlots(children, status, meta, count)}
    </button>
  );
}

function SidebarNavGroup({ label, className, children, ...props }: SidebarNavGroupProps) {
  return (
    <details data-slot="sidebar-nav-group" className={cn("group", className)} {...props}>
      <summary
        data-slot="sidebar-nav-group-trigger"
        className="flex min-h-target cursor-pointer list-none items-center justify-between gap-stack-sm rounded-md px-control-inline text-dense font-medium focus-ring-control [&::-webkit-details-marker]:hidden"
      >
        <span className="content-shrink">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-icon shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      {children}
    </details>
  );
}

export { SidebarNavGroup, SidebarNavItem };
