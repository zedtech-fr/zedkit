export type ComboboxOption = {
  value: string;
  label: string;
};

export function filterComboboxOptions(options: readonly ComboboxOption[], query: string): ComboboxOption[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [...options];
  return options.filter((option) => option.label.toLowerCase().includes(trimmed));
}

export function itemToString(option: ComboboxOption | null): string {
  return option?.label ?? "";
}
