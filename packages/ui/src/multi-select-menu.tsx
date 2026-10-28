"use client";

import { useCombobox } from "downshift";

import { Spinner } from "./spinner.js";
import { cn } from "./utils.js";
import type { ComboboxOption } from "./combobox-shared.js";

export function MultiSelectMenu({
  emptyMessage,
  getItemProps,
  getMenuProps,
  highlightedIndex,
  items,
  loading,
  selectedValues,
}: {
  emptyMessage: string;
  getItemProps: ReturnType<typeof useCombobox<ComboboxOption>>["getItemProps"];
  getMenuProps: ReturnType<typeof useCombobox<ComboboxOption>>["getMenuProps"];
  highlightedIndex: number;
  items: ComboboxOption[];
  loading: boolean;
  selectedValues: Set<string>;
}) {
  return (
    <ul
      {...getMenuProps()}
      className="max-h-[--radix-select-content-available-height] overflow-y-auto p-1 outline-none"
      data-slot="multi-select-list"
    >
      {loading ? (
        <li className="flex items-center gap-2 px-control-inline py-control-block text-sm text-muted-foreground">
          <Spinner label="Loading options" />
          Loading…
        </li>
      ) : null}
      {!loading && items.length === 0 ? (
        <li className="px-control-inline py-control-block text-sm text-muted-foreground">{emptyMessage}</li>
      ) : null}
      {!loading
        ? items.map((item, index) => {
            const picked = selectedValues.has(item.value);
            return (
              <li
                key={item.value}
                {...getItemProps({ item, index })}
                className={cn(
                  "cursor-default rounded-sm px-control-inline py-control-block text-sm outline-none",
                  highlightedIndex === index ? "bg-accent text-accent-foreground" : "",
                  picked ? "opacity-60" : "",
                )}
              >
                {item.label}
                {picked ? " (selected)" : ""}
              </li>
            );
          })
        : null}
    </ul>
  );
}
