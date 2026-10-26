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

export interface DetailPanelRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

/**
 * One label/value row. Compose custom panels with these inside a
 * `<dl>`; `DetailPanel` covers the plain `items[]` case.
 */
export function DetailPanelRow({ label, value, className }: DetailPanelRowProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-detail-panel-gap px-detail-panel-inline py-detail-panel-block text-sm", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value}</dd>
    </div>
  );
}

export function DetailPanel({ items, className }: DetailPanelProps) {
  return (
    <dl className={cn("divide-y divide-border rounded-lg border", className)}>
      {items.map((item, index) => (
        <DetailPanelRow key={index} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}
