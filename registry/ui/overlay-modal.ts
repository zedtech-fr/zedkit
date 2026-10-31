/**
 * Shared modal-overlay behavior for Dialog, Drawer/Sheet, and other
 * Radix/Vaul surfaces: mount autofocus must run when the overlay is modal
 * so FocusScope traps keyboard users (WAI-APG). Vaul disables it by default.
 */
function resolveModalMountAutoFocus(autoFocus: boolean | undefined, modal: boolean): boolean {
  if (autoFocus !== undefined) return autoFocus;
  return modal;
}

export { resolveModalMountAutoFocus };
