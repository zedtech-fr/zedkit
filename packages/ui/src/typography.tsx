import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";

// No shadcn registry item exists for typography (docs-only class
// recipes), so these two thin wrappers carry the documented styles.
// They exist so consumers can ban raw h1-h6/p tags entirely.

const headingVariants = cva("scroll-m-heading-scroll tracking-tight", {
  variants: {
    level: {
      1: "text-4xl font-extrabold lg:text-5xl",
      2: "text-3xl font-semibold",
      3: "text-2xl font-semibold",
      4: "text-xl font-semibold",
    },
  },
  defaultVariants: {
    level: 1,
  },
});

export type HeadingProps = React.ComponentProps<"h1"> &
  VariantProps<typeof headingVariants> & {
    /** Heading level: picks the default tag (`h1`-`h4`) and size. */
    level?: 1 | 2 | 3 | 4;
    /** Tag override when the outline needs a different element. */
    as?: "h1" | "h2" | "h3" | "h4" | "div";
    /** Merge styles onto the child (Radix Slot) instead of rendering a tag. */
    asChild?: boolean;
  };

function Heading({ level = 1, as, asChild = false, className, ...props }: HeadingProps) {
  if (asChild) {
    return (
      <Slot data-slot="heading" className={cn(headingVariants({ level }), className)} {...props} />
    );
  }
  const Tag = (as ?? `h${level}`) as "h1";
  return <Tag data-slot="heading" className={cn(headingVariants({ level }), className)} {...props} />;
}

const textVariants = cva("leading-body", {
  variants: {
    variant: {
      body: "",
      muted: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export type TextProps = React.ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    /** Tag override (`p` by default). */
    as?: "p" | "span" | "div";
    /** Merge styles onto the child (Radix Slot) instead of rendering a tag. */
    asChild?: boolean;
  };

function Text({ variant, as: Tag = "p", asChild = false, className, ...props }: TextProps) {
  if (asChild) {
    return <Slot data-slot="text" className={cn(textVariants({ variant }), className)} {...props} />;
  }
  return <Tag data-slot="text" className={cn(textVariants({ variant }), className)} {...props} />;
}

export { Heading, headingVariants, Text, textVariants };
