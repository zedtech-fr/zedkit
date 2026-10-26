import * as React from "react";
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

export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    /** Heading level: picks the default tag (`h1`-`h4`) and size. */
    level?: 1 | 2 | 3 | 4;
    /** Tag override when the outline needs a different element. */
    as?: "h1" | "h2" | "h3" | "h4" | "div";
    /** Merge styles onto the child (Radix Slot) instead of rendering a tag. */
    asChild?: boolean;
  };

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 1, as, asChild = false, className, ...props }, ref) => {
    if (asChild) {
      return <Slot ref={ref} className={cn(headingVariants({ level }), className)} {...props} />;
    }
    const Tag = (as ?? `h${level}`) as "h1";
    return <Tag ref={ref} className={cn(headingVariants({ level }), className)} {...props} />;
  },
);
Heading.displayName = "Heading";

const textVariants = cva("leading-7", {
  variants: {
    variant: {
      body: "",
      muted: "text-sm text-muted-foreground",
      /** Eyebrow above a value: small, muted, capitals. Never larger than the text it labels. */
      label: "text-xs leading-5 font-medium tracking-wide text-muted-foreground uppercase",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    /** Tag override (`p` by default). */
    as?: "p" | "span" | "div";
    /** Merge styles onto the child (Radix Slot) instead of rendering a tag. */
    asChild?: boolean;
  };

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant, as: Tag = "p", asChild = false, className, ...props }, ref) => {
    if (asChild) {
      return <Slot ref={ref} className={cn(textVariants({ variant }), className)} {...props} />;
    }
    return <Tag ref={ref} className={cn(textVariants({ variant }), className)} {...props} />;
  },
);
Text.displayName = "Text";

export { Heading, headingVariants, Text, textVariants };
