import type * as React from "react";

import { cn } from "../utils.js";

export interface DetailItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

export interface DetailPanelProps {
  items: DetailItem[];
  className?: string;
  variant?: "list" | "grid";
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
    <div data-slot="detail-panel-row" className={cn("grid grid-trio gap-detail-panel-gap px-detail-panel-inline py-detail-panel-block text-dense", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="span-rest content-shrink font-medium break-words">{value}</dd>
    </div>
  );
}

export function DetailPanel({ items, className, variant = "list" }: DetailPanelProps) {
  const isGrid = variant === "grid";
  return (
    <dl
      data-slot="detail-panel"
      data-variant={variant}
      className={cn(
        isGrid
          ? "grid content-shrink grid-pair gap-stack-md sm:grid-trio lg:grid-quint"
          : "divide-y divide-border rounded-lg border",
        className,
      )}
    >
      {isGrid
        ? items.map((item, index) => (
            <div key={index} data-slot="detail-panel-cell" className="content-shrink">
              <dt className="text-dense text-muted-foreground">{item.label}</dt>
              <dd className="content-shrink text-stat break-words tabular-nums">{item.value}</dd>
            </div>
          ))
        : items.map((item, index) => <DetailPanelRow key={index} label={item.label} value={item.value} />)}
    </dl>
  );
}
