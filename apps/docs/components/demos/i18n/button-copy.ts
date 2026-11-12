export const buttonCopy = {
  createApp: "Create app",
  cancel: "Cancel",
  details: "Details",
  delete: "Delete",
  docsLink: "Docs link",
  small: "Small",
  default: "Default",
  large: "Large",
  addItemAriaLabel: "Add item",
  saving: "Saving…",
  created: "App created",
  cancelled: "Cancelled",
  openedDetails: "Details opened",
  deleted: "App deleted",
} as const;

export type ButtonCopy = typeof buttonCopy;
