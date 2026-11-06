"use client";

import { formatMessage } from "@zedtech/zedkit-i18n";
import { X } from "lucide-react";
import type { useMultipleSelection } from "downshift";

import { Badge } from "./badge.js";
import type { ComboboxOption } from "./combobox-shared.js";
import { useUiMessages } from "./ui-provider.js";

type MultiSelectChipsProps = {
  items: ComboboxOption[];
  onRemove: (item: ComboboxOption) => void;
  selection: ReturnType<typeof useMultipleSelection<ComboboxOption>>;
  disabled?: boolean;
};

function MultiSelectChips({ items, onRemove, selection, disabled }: MultiSelectChipsProps) {
  const messages = useUiMessages();
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, index) => (
        <Badge key={item.value} variant="secondary" className="gap-1 pr-1">
          <span {...selection.getSelectedItemProps({ selectedItem: item, index })}>{item.label}</span>
          <button
            type="button"
            disabled={disabled}
            aria-label={formatMessage(messages.removeItem, { label: item.label })}
            onClick={() => {
              if (disabled) return;
              onRemove(item);
            }}
          >
            <X className="size-4" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export { MultiSelectChips };
