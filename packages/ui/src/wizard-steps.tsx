import { CheckIcon } from "lucide-react";

import { cn } from "./utils.js";

export interface WizardStepsProps {
  steps: string[];
  /** 0-based index of the current step. */
  current: number;
  className?: string;
}

export function WizardSteps({ steps, current, className }: WizardStepsProps) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)} aria-label="Progress">
      {steps.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className="flex items-center gap-2 text-sm"
        >
          <span
            aria-hidden
            className={cn(
              "flex size-6 items-center justify-center rounded-full border text-xs font-medium",
              index < current && "border-primary bg-primary text-primary-foreground",
              index === current && "border-primary text-primary",
              index > current && "text-muted-foreground",
            )}
          >
            {index < current ? <CheckIcon className="size-3.5" /> : index + 1}
          </span>
          <span className={cn(index === current ? "font-medium" : "text-muted-foreground")}>{step}</span>
          {index < steps.length - 1 ? (
            <span aria-hidden className="ml-1 h-px w-6 bg-border" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
