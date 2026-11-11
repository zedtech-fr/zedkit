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

type ButtonRest = Omit<
  React.ComponentProps<"button">,
  "className" | "children" | "disabled" | "type"
>;

type AsChildHostProps = {
  className?: string;
  children?: React.ReactNode;
  "aria-current"?: React.AriaAttributes["aria-current"] | undefined;
  "aria-disabled"?: React.AriaAttributes["aria-disabled"] | undefined;
  "data-slot"?: string;
  "data-active"?: string | undefined;
} & ButtonRest;

function isElementHost(node: React.ReactNode): node is React.ReactElement<AsChildHostProps> {
  return React.isValidElement(node) && node.type !== React.Fragment;
}

function isHandlerKey(key: string): boolean {
  return /^on[A-Z]/.test(key);
}

function composeHandler(childHandler: unknown, restHandler: unknown): unknown {
  if (typeof childHandler !== "function") return restHandler;
  if (typeof restHandler !== "function") return childHandler;
  return (event: { defaultPrevented: boolean }) => {
    (childHandler as (event: { defaultPrevented: boolean }) => void)(event);
    if (!event.defaultPrevented) {
      (restHandler as (event: { defaultPrevented: boolean }) => void)(event);
    }
  };
}

function mergeAsChildRest(childProps: AsChildHostProps, rest: ButtonRest): ButtonRest {
  const merged: Record<string, unknown> = { ...rest };
  for (const key of Object.keys(rest)) {
    if (!isHandlerKey(key)) continue;
    merged[key] = composeHandler(
      childProps[key as keyof AsChildHostProps],
      rest[key as keyof ButtonRest],
    );
  }
  return merged as ButtonRest;
}

function warnInvalidAsChild(children: React.ReactNode) {
  if (React.Children.toArray(children).some((node) => React.isValidElement(node))) {
    console.warn(
      "SidebarNavItem asChild needs a single host element; falling back to a button.",
    );
  }
}

function itemSlots(
  title: React.ReactNode,
  status: React.ReactNode | undefined,
  meta: React.ReactNode | undefined,
  count: React.ReactNode | undefined,
) {
  return (
    <>
      {status != null ? (
        <span data-slot="sidebar-nav-item-status" className="shrink-0" aria-hidden>
          {status}
        </span>
      ) : null}
      <span data-slot="sidebar-nav-item-title" className="content-shrink flex-1 truncate text-left">
        {title}
      </span>
      {meta != null || count != null ? (
        <span
          data-slot="sidebar-nav-item-trail"
          className="ml-auto flex shrink-0 items-center gap-stack-tight text-caption text-muted-foreground"
          aria-hidden
        >
          {meta != null ? <span data-slot="sidebar-nav-item-meta">{meta}</span> : null}
          {count != null ? <span data-slot="sidebar-nav-item-count">{count}</span> : null}
        </span>
      ) : null}
    </>
  );
}

function itemClassName(
  active: boolean,
  disabled: boolean | undefined,
  className: string | undefined,
  asChild = false,
) {
  return cn(
    "flex min-h-target w-full cursor-pointer items-center gap-stack-sm rounded-md px-control-inline text-left text-dense focus-ring-control disabled:pointer-events-none disabled:cursor-not-allowed disabled:fade-disabled",
    !active && "hover:ghost-hover",
    active && "muted-wash font-medium",
    asChild && disabled && "pointer-events-none cursor-not-allowed fade-disabled",
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
  disabled,
  type = "button",
  ...rest
}: SidebarNavItemProps) {
  if (asChild && isElementHost(children)) {
    let hostProps = mergeAsChildRest(children.props, rest);
    if (disabled) {
      const prevClick = hostProps.onClick ?? children.props.onClick;
      const prevKeyDown = hostProps.onKeyDown ?? children.props.onKeyDown;
      hostProps = {
        ...hostProps,
        onClick: (event) => {
          prevClick?.(event);
          event.preventDefault();
        },
        onKeyDown: (event) => {
          prevKeyDown?.(event);
          if (event.key === "Enter" || event.key === " ") event.preventDefault();
        },
      };
    }
    return React.cloneElement(children, {
      "aria-current": active ? "page" : undefined,
      ...hostProps,
      className: itemClassName(active, disabled, cn(children.props.className, className), true),
      "data-slot": "sidebar-nav-item",
      "data-active": active ? "" : undefined,
      "aria-disabled": disabled ? true : undefined,
      children: itemSlots(children.props.children, status, meta, count),
    });
  }

  if (asChild) warnInvalidAsChild(children);

  return (
    <button
      type={type}
      data-slot="sidebar-nav-item"
      data-active={active ? "" : undefined}
      aria-current={active ? "true" : undefined}
      className={itemClassName(active, disabled, className)}
      disabled={disabled}
      {...rest}
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
        <span className="content-shrink flex-1 truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-icon shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      <div data-slot="sidebar-nav-group-body" className="pl-control-inline">
        {children}
      </div>
    </details>
  );
}

export { SidebarNavGroup, SidebarNavItem };
