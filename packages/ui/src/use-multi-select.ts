"use client";

import { useEffect, useMemo, useState } from "react";
import { useCombobox, useMultipleSelection } from "downshift";

import { filterComboboxOptions, itemToString, type ComboboxOption } from "./combobox-shared.js";
import type { MultiSelectProps } from "./multi-select-types.js";

export function useMultiSelectLogic({
  options,
  value = [],
  onValueChange,
}: Pick<MultiSelectProps, "options" | "value" | "onValueChange">) {
  const selectedItems = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );
  const [filteredItems, setFilteredItems] = useState<ComboboxOption[]>(() => [...options]);

  useEffect(() => {
    setFilteredItems([...options]);
  }, [options]);

  const selection = useMultipleSelection({
    selectedItems,
    onStateChange: ({ selectedItems: nextItems, type }) => {
      if (
        type === useMultipleSelection.stateChangeTypes.SelectedItemKeyDownBackspace ||
        type === useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem
      ) {
        if (nextItems) onValueChange?.(nextItems.map((item) => item.value));
      }
    },
  });

  const combobox = useCombobox({
    items: filteredItems,
    itemToString,
    selectedItem: null,
    onInputValueChange: ({ inputValue: next }) => {
      setFilteredItems(filterComboboxOptions(options, next ?? ""));
    },
    onSelectedItemChange: ({ selectedItem: picked }) => {
      if (!picked || value.includes(picked.value)) return;
      onValueChange?.([...value, picked.value]);
    },
    stateReducer: (_state, actionAndChanges) => {
      const { changes, type } = actionAndChanges;
      if (
        type === useCombobox.stateChangeTypes.InputKeyDownEnter ||
        type === useCombobox.stateChangeTypes.ItemClick
      ) {
        return { ...changes, inputValue: "", isOpen: true };
      }
      return changes;
    },
  });

  const selectedValues = useMemo(() => new Set(value), [value]);

  return { combobox, filteredItems, selectedItems, selectedValues, selection };
}
