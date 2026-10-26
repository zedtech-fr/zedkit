import type * as React from "react";

import { cn } from "./utils.js";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-page-header-offset flex flex-wrap items-start justify-between gap-page-header-gap", className)}>
      <div className="space-y-page-header-title-gap">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-page-header-actions-gap">{actions}</div> : null}
    </div>
  );
}
