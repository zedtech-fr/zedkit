import type * as React from "react";

import { cn } from "./utils.js";

export interface OptionCard {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}

export interface OptionCardsProps {
  options: OptionCard[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  className?: string;
}

export function OptionCards({ options, selected, onChange, label = "Options", className }: OptionCardsProps) {
  function toggle(id: string): void {
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  }

  return (
    <div role="group" aria-label={label} className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors hover:border-muted-foreground/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={selected.includes(option.id)}
            onChange={() => toggle(option.id)}
          />
          <span>
            <span className="block font-medium">{option.title}</span>
            {option.description ? (
              <span className="block text-sm text-muted-foreground">{option.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}
