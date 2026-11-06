"use client";

import { useEffect, useMemo, useState, type FocusEvent } from "react";
import { useCombobox } from "downshift";

import { filterComboboxOptions, itemToString, type ComboboxOption } from "./combobox-shared.js";
import type { ComboboxProps } from "./combobox-types.js";
import { useUiMessages } from "./ui-provider.js";

export function useComboboxLogic({
  options,
  value = null,
  onValueChange,
  disabled = false,
  placeholder,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: ComboboxProps) {
  const messages = useUiMessages();
  const resolvedPlaceholder = placeholder ?? messages.search;
  const selectedItem = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );
  const [filteredItems, setFilteredItems] = useState<ComboboxOption[]>(() => [...options]);

  useEffect(() => {
    setFilteredItems([...options]);
  }, [options]);

  const combobox = useCombobox({
    items: filteredItems,
    selectedItem,
    itemToString,
    onSelectedItemChange: ({ selectedItem: next }) => onValueChange?.(next?.value ?? null),
    onInputValueChange: ({ inputValue: next }) => {
      setFilteredItems(filterComboboxOptions(options, next ?? ""));
    },
    onIsOpenChange: ({ isOpen: nextOpen, selectedItem: current }) => {
      if (nextOpen) {
        setFilteredItems(filterComboboxOptions(options, current ? itemToString(current) : ""));
      }
    },
  });

  const inputProps = combobox.getInputProps({
    ...(disabled ? { disabled: true } : {}),
    placeholder: resolvedPlaceholder,
    ...(id ? { id } : {}),
    ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {}),
  });

  const openOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    (inputProps as import("react").InputHTMLAttributes<HTMLInputElement>).onFocus?.(event);
    combobox.openMenu();
  };

  return { filteredItems, inputProps, openOnFocus, combobox };
}
