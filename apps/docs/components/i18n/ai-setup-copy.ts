/** English copy for the AI setup guide. Keys only; no markup. */
export const aiSetupCopy = {
  title: {
    prefix: "Set up zedkit AI in",
    h1Label: "Set up zedkit AI in Cursor, Muse, Claude, or your choice",
    words: ["Cursor", "Muse", "Claude", "your choice"],
    lead: "Give your coding agent one prompt to set up zedkit AI in your project.",
  },
  prompt: {
    pasteBefore:
      "Paste this as the only message in a new chat at the repo root (Cursor, Muse, Claude Code, or your tool — agents should fetch",
    pasteAfter: "):",
    walkthroughLead: "Full walkthrough:",
    copyWhat: "Agent setup prompt",
  },
} as const;

export type AiSetupCopy = typeof aiSetupCopy;
