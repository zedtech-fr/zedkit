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

const DEFAULT_REGIONS = [
  { value: "eu", label: "Europe" },
  { value: "us", label: "Americas" },
];

export function RegionSelect({
  onChange,
  regions = DEFAULT_REGIONS,
}: {
  onChange?: (value: string) => void;
  regions?: { value: string; label: string }[];
}) {
  return (
    <Select onValueChange={onChange}>
      <SelectTrigger aria-label="Region">
        <SelectValue placeholder="Pick a region" />
      </SelectTrigger>
      <SelectContent>
        {regions.length === 0 ? (
          <SelectItem value="none" disabled>
            No regions available
          </SelectItem>
        ) : (
          <SelectGroup>
            <SelectLabel>Regions</SelectLabel>
            {regions.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
