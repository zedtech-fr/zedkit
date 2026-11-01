/** English copy for the identity demo editor page. Keys only; no markup. */
export const identityEditorCopy = {
  metadata: {
    title: "Identity demo editor",
    description:
      "Try spacing, colour, and type tokens in the browser. Demo only — not a shipped docs feature.",
  },
  heading: "Try looks in the demo editor",
  body: "Tune tokens and preview them on a card. Use Apply to the whole site only when you mean to change the docs shell; the home hero demo uses its own scoped selector.",
} as const;

export type IdentityEditorCopy = typeof identityEditorCopy;
