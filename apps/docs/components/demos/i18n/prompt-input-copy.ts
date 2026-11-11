/** English copy for the prompt-input demos. Keys only; no markup. */
export const promptInputCopy = {
  sendLabel: "Send",
  messageAriaLabel: "Message",
  simple: {
    placeholder: "Ask anything",
    idleHint: "Enter sends, Shift+Enter adds a line.",
    sentLine: (sent: string) => `Sent: ${sent}`,
  },
  complete: {
    draft: "A calm studio site",
    cancelLabel: "Stop",
    waiting: "Waiting for a reply. Stop cancels.",
    idleHint: "Send to see the busy state.",
  },
} as const;

export type PromptInputCopy = typeof promptInputCopy;
