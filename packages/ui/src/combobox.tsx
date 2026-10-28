"use client";

import { ChevronDown } from "lucide-react";

import type { ComboboxProps } from "./combobox-types.js";
import { ComboboxMenu } from "./combobox-menu.js";
import { Input } from "./input.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";
import { useUiMessages } from "./ui-provider.js";
import { useComboboxLogic } from "./use-combobox.js";

export type { ComboboxProps } from "./combobox-types.js";
export type { ComboboxOption } from "./combobox-shared.js";

function Combobox(props: ComboboxProps) {
  const messages = useUiMessages();
  const { combobox, filteredItems, inputProps, openOnFocus } = useComboboxLogic(props);
  const emptyMessage = props.emptyMessage ?? messages.empty;
  const loading = props.loading ?? false;

  return (
    <Popover open={combobox.isOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full" data-slot="combobox">
          <Input {...inputProps} className="pr-control-height" onFocus={openOnFocus} />
          <button
            type="button"
            {...combobox.getToggleButtonProps({ disabled: Boolean(props.disabled) })}
            className="absolute top-1/2 right-control-inline -translate-y-1/2 text-muted-foreground"
            aria-label={messages.options}
          >
            <ChevronDown className="size-icon-control opacity-50" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <ComboboxMenu
          emptyMessage={emptyMessage}
          getItemProps={combobox.getItemProps}
          getMenuProps={combobox.getMenuProps}
          highlightedIndex={combobox.highlightedIndex}
          items={filteredItems}
          loading={loading}
        />
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
