"use client";

import type { ReactNode } from "react";
import { BookOpenText } from "lucide-react";
import { IconLabel } from "@zedtech/zedkit-ui";

export function DocsActionLabel({ children }: { children: ReactNode }) {
  return (
    <IconLabel icon={BookOpenText} className="text-current">
      {children}
    </IconLabel>
  );
}
