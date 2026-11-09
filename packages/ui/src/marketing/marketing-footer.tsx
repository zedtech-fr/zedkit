import { Children, useId } from "react";
import type * as React from "react";

import { Container } from "../layout/layout.js";
import { Text } from "../typography/typography.js";
import { cn } from "../utils.js";

export interface MarketingFooterColumn {
  /** Stable key; falls back to the position. */
  id?: string | undefined;
  /** Column heading, for example "Product". */
  title: string;
  /** Links (anchors or your router's links). */
  links: React.ReactNode[];
}

export type MarketingFooterProps = Omit<React.ComponentProps<"footer">, "children"> & {
  /** Logo and name. */
  brand?: React.ReactNode;
  /** One sentence under the brand. */
  description?: React.ReactNode;
  /** Link columns; each is its own labelled navigation. */
  columns?: MarketingFooterColumn[] | undefined;
  /** Bottom line: copyright, legal links, language switch. */
  legal?: React.ReactNode;
};

const linkClass =
  "[&_a]:inline-flex [&_a]:min-h-target [&_a]:items-center [&_a]:text-dense [&_a]:text-muted-foreground [&_a]:hover:text-foreground [&_a]:hover:underline";

function FooterColumn({ column }: { column: MarketingFooterColumn }) {
  const titleId = useId();
  return (
    <nav aria-labelledby={titleId} className="flex content-shrink flex-col gap-stack-tight">
      <p id={titleId} className="text-dense font-semibold">
        {column.title}
      </p>
      <ul className={cn("flex list-none flex-col flush", linkClass)}>
        {Children.toArray(column.links).map((link, index) => (
          <li key={index}>{link}</li>
        ))}
      </ul>
    </nav>
  );
}

/** Public-page footer: brand, short description, link columns, bottom line. */
function MarketingFooter({ brand, description, columns = [], legal, className, ...props }: MarketingFooterProps) {
  return (
    <footer data-slot="marketing-footer" className={cn("border-t bg-card text-card-foreground", className)} {...props}>
      <Container width="default" className="flex flex-col gap-section-stack py-section-md">
        <div className="grid gap-section-stack md:grid-trio">
          <div className="flex content-shrink flex-col gap-stack-md">
            {brand}
            {description ? <Text variant="muted">{description}</Text> : null}
          </div>
          {columns.length > 0 ? (
            <div className="grid grid-pair gap-blocks sm:grid-trio md:span-rest">
              {columns.map((column, index) => (
                <FooterColumn key={column.id ?? index} column={column} />
              ))}
            </div>
          ) : null}
        </div>
        {legal ? (
          <div
            data-slot="marketing-footer-legal"
            className="flex flex-col gap-stack-md border-t pt-footer-note text-dense text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
          >
            {legal}
          </div>
        ) : null}
      </Container>
    </footer>
  );
}

export { MarketingFooter };
