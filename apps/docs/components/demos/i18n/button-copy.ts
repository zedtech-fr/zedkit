export const buttonCopy = {
  hint: "Visual variants only — buttons here do not run actions.",
  createApp: "Create app",
  cancel: "Cancel",
  details: "Details",
  delete: "Delete",
  docsLink: "Docs link",
  small: "Small",
  default: "Default",
  large: "Large",
  addItemAriaLabel: "Add item",
  disabled: "Disabled",
  saving: "Saving…",
} as const;

export type ButtonCopy = typeof buttonCopy;
