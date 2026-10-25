import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";

// No shadcn registry item exists for typography (docs-only class
// recipes), so these two thin wrappers carry the documented styles.
// They exist so consumers can ban raw h1-h6/p tags entirely.

const headingVariants = cva("scroll-m-20 tracking-tight", {
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
  };

function Heading({ level = 1, as, className, ...props }: HeadingProps) {
  const Tag = (as ?? `h${level}`) as "h1";
  return <Tag className={cn(headingVariants({ level }), className)} {...props} />;
}

const textVariants = cva("leading-7", {
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

export type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    /** Tag override (`p` by default). */
    as?: "p" | "span" | "div";
  };

function Text({ variant, as: Tag = "p", className, ...props }: TextProps) {
  return <Tag className={cn(textVariants({ variant }), className)} {...props} />;
}

export { Heading, headingVariants, Text, textVariants };
