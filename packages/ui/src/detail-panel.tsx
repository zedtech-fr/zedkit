import type * as React from "react";

import { cn } from "./utils.js";

export interface DetailItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

export interface DetailPanelProps {
  items: DetailItem[];
  className?: string;
}

export function DetailPanel({ items, className }: DetailPanelProps) {
  return (
    <dl className={cn("divide-y divide-border rounded-lg border", className)}>
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="col-span-2 font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
