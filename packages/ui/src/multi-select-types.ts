import type { ComboboxOption } from "./combobox-shared.js";

export type MultiSelectProps = {
  options: readonly ComboboxOption[];
  value?: readonly string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};
