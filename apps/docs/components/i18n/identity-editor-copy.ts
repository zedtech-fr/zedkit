/** English copy for the identity editor. Keys only; no markup. */
export const identityEditorCopy = {
  export: {
    contrastTitle: "Contrast below WCAG AA",
    contrastDescription:
      "Some text or control colours fail 4.5:1 (or 3:1 for accents and borders). Exporting them can make copy unreadable. Fix the warnings above, or export anyway if you accept the risk.",
    confirmLabel: "Export anyway",
    blocked: "Copy is blocked until you fix contrast warnings or confirm export.",
    css: "CSS",
    json: "JSON",
    copyCss: "Copy CSS",
    copyJson: "Copy JSON",
    copied: (kind: "css" | "json") => `Copied ${kind === "css" ? "CSS" : "JSON"}.`,
  },
  fields: {
    scalar: {
      spacing: "Spacing",
      borderWidth: "Border width",
      radius: "Radius",
      bodyLeading: "Line height",
      headingLeading: "Heading line height",
      headingTracking: "Letter spacing",
      labelTracking: "Label spacing",
      shadowSm: "Shadow",
      shadowMd: "Large shadow",
    },
    light: {
      background: "Background",
      foreground: "Foreground",
      primary: "Primary",
      primaryForeground: "Primary text",
      accent: "Accent",
      border: "Border",
      mutedForeground: "Muted text",
    },
    groups: {
      shape: "Shape and spacing",
      type: "Type rhythm",
      depth: "Depth",
      colour: (scheme: "light" | "dark") => `Colour (${scheme})`,
    },
    draft: {
      status: "Active",
      secondary: "Revert",
      outline: "Preview",
      destructive: "Remove",
      inputLabel: "Workspace",
      inputValue: "Harbor Console",
      rows: [
        ["Owner", "Maya Laurent"],
        ["Region", "Europe"],
        ["Plan", "Team"],
      ],
      alertTitle: "Billing ends 14 November",
      alertBody: "Add a payment method to keep the workspace.",
    },
    draftTitle: "Draft look",
    draftBody: "Spacing, type and colour follow the fields.",
    draftSave: "Save",
    contrastBadge: (scheme: string, label: string, ratio: number, min: number) =>
      `${scheme} ${label} ${ratio}:1 (need ${min}:1)`,
    fix: (scheme: string, label: string) => `Fix ${scheme} ${label}`,
  },
  panel: {
    hint: "Change spacing first, then watch the card.",
    applied: "Applied to the whole site.",
  },
  suggest: {
    noChanges: "No token changes.",
    diffRow: (path: string, from: string, to: string) => `${path}: ${from} → ${to}`,
    contrastPassed:
      "Contrast check passed (body, primary, and muted text 4.5:1; accent and border 3:1).",
    applySite: "Also apply to the whole site",
    apply: "Apply",
    discard: "Discard",
    intro: "Describe a look, then Suggest. Review the list before Apply.",
    request: "Request",
    suggest: "Suggest",
    suggesting: "Suggesting…",
  },
  toolbar: {
    look: "Look",
    name: "Name",
    saveLook: "Save look",
    rename: "Rename",
    delete: "Delete",
    dark: "Dark",
    undo: "Undo",
    reset: "Reset",
    applySite: "Apply to the whole site",
  },
} as const;

export type IdentityEditorCopy = typeof identityEditorCopy;
