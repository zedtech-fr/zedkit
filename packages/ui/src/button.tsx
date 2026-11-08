"use client";

import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils.js";

const buttonVariants = cva(
  "box-border inline-flex cursor-pointer items-center justify-center gap-button-gap rounded-md text-dense font-medium whitespace-nowrap focus-ring-control disabled:pointer-events-none disabled:cursor-not-allowed disabled:fade-disabled motion-safe:button-press [&_svg]:pointer-events-none [&_svg]:size-icon [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:destructive-hover",
        outline:
          "border border-input bg-background text-foreground shadow-sm hover:bg-muted hover:text-foreground aria-pressed:border-input aria-pressed:bg-secondary aria-pressed:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:secondary-hover",
        ghost:
          "text-foreground hover:ghost-hover hover:text-foreground aria-pressed:ghost-pressed aria-pressed:text-secondary-foreground",
        link: "text-primary link-offset hover:underline focus-visible:underline",
      },
      size: {
        default: "h-control-height px-button-pad py-control-block-lg",
        sm: "h-control-height-sm rounded-md px-button-inline-sm py-control-block text-caption",
        lg: "h-control-height-lg rounded-md px-button-pad-lg",
        icon: "size-control-height",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        class:
          "h-auto pane-shrink bg-transparent flush-block shadow-none hover:bg-transparent active:bg-transparent",
      },
      { variant: "link", size: "sm", class: "min-h-target px-control-tight text-dense" },
      { variant: "link", size: "default", class: "min-h-target px-control-inline" },
      { variant: "link", size: "lg", class: "min-h-target px-button-pad" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
