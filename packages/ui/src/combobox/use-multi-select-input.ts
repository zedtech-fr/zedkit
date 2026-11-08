"use client";

import type { FocusEvent } from "react";
import type { useCombobox, useMultipleSelection } from "downshift";

import type { ComboboxOption } from "./combobox-shared.js";

export function useMultiSelectInputProps(
  combobox: ReturnType<typeof useCombobox<ComboboxOption>>,
  selection: ReturnType<typeof useMultipleSelection<ComboboxOption>>,
) {
  const dropdownProps = selection.getDropdownProps({ preventKeyAction: combobox.isOpen });
  const inputProps = combobox.getInputProps(dropdownProps);
  const openOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    (inputProps as import("react").InputHTMLAttributes<HTMLInputElement>).onFocus?.(event);
    combobox.openMenu();
  };

  return { inputProps, openOnFocus };
}
