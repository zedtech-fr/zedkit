function resolveModalMountAutoFocus(autoFocus: boolean | undefined, modal: boolean): boolean {
  return autoFocus ?? modal;
}

export { resolveModalMountAutoFocus };
