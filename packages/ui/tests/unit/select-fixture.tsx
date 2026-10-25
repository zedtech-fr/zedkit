import { vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "#index.js";

/**
 * Radix Select positions its portal with browser-only APIs; stub the
 * ones jsdom lacks so open/close behaves (no layout is asserted).
 * Called from `beforeAll` in the suites that open a select.
 */
export function stubSelectJsdom(): void {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  window.ResizeObserver ??= class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

export function RegionSelect({ onChange }: { onChange?: (value: string) => void }) {
  return (
    <Select onValueChange={onChange}>
      <SelectTrigger aria-label="Region">
        <SelectValue placeholder="Pick a region" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Regions</SelectLabel>
          <SelectItem value="eu">Europe</SelectItem>
          <SelectItem value="us">Americas</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
