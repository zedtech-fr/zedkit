import type { ComboboxOption } from "./combobox-shared.js";

export type ComboboxProps = {
  options: readonly ComboboxOption[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};
