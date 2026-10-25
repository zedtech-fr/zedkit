import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";
import { Heading } from "./typography.js";
import { Text } from "./typography.js";

// No shadcn source exists for layout stacks/sections, so these two
// thin wrappers carry the documented spacing patterns. They exist so
// consumers can replace raw <section>/<div> stacks entirely.

const stackVariants = cva("flex", {
  variants: {
    direction: {
      vertical: "flex-col",
      horizontal: "flex-row items-center",
    },
    gap: {
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
    },
  },
  defaultVariants: {
    direction: "vertical",
    gap: 4,
  },
});

export type StackProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof stackVariants> & {
    direction?: "vertical" | "horizontal";
    gap?: 1 | 2 | 3 | 4 | 6 | 8;
  };

function Stack({ direction, gap, className, ...props }: StackProps) {
  return <div className={cn(stackVariants({ direction, gap }), className)} {...props} />;
}

export type SectionProps = React.HTMLAttributes<HTMLElement> & {
  /** Section title, rendered as a level-2 heading. */
  title?: React.ReactNode;
  /** Muted description under the title. */
  description?: React.ReactNode;
  /** Actions row, right-aligned next to the title. */
  actions?: React.ReactNode;
};

function Section({ title, description, actions, children, className, ...props }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <Heading level={2}>{title}</Heading>}
            {description && <Text variant="muted">{description}</Text>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export { Stack, stackVariants, Section };
