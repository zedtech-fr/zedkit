import {
  AI_SETUP_MINI_PROMPT,
  MAP_SETUP_MINI_PROMPT,
  SUGGEST_MINI_PROMPT,
  UI_SETUP_MINI_PROMPT,
} from "./ai-setup-onboarding.generated";

export const SETUP_ENTRY_IDS = ["ai", "ui", "combined", "suggest"] as const;

export type SetupEntryId = (typeof SETUP_ENTRY_IDS)[number];

export type SetupEntryRole = "peer" | "secondary" | "quiet";

export type SetupEntryPrompt = {
  id: SetupEntryId;
  value: string;
  role: SetupEntryRole;
  label: string;
  ariaLabel: string;
  copyLabel: string;
};

/** Four mini prompts the home band and Getting started copy. Bodies come from generate, never literals. */
export const SETUP_ENTRY_PROMPTS: readonly SetupEntryPrompt[] = [
  {
    id: "ai",
    value: AI_SETUP_MINI_PROMPT,
    role: "peer",
    label: "AI setup",
    ariaLabel: "AI setup prompt",
    copyLabel: "Copy AI setup prompt",
  },
  {
    id: "ui",
    value: UI_SETUP_MINI_PROMPT,
    role: "peer",
    label: "UI setup",
    ariaLabel: "UI setup prompt",
    copyLabel: "Copy UI setup prompt",
  },
  {
    id: "combined",
    value: MAP_SETUP_MINI_PROMPT,
    role: "secondary",
    label: "AI, UI and Nest",
    ariaLabel: "Combined setup prompt",
    copyLabel: "Copy combined setup prompt",
  },
  {
    id: "suggest",
    value: SUGGEST_MINI_PROMPT,
    role: "quiet",
    label: "Suggest which setup",
    ariaLabel: "Suggest setup prompt",
    copyLabel: "Copy suggest prompt",
  },
];

const BY_ID = Object.fromEntries(SETUP_ENTRY_PROMPTS.map((entry) => [entry.id, entry])) as {
  readonly [K in SetupEntryId]: SetupEntryPrompt;
};

export function setupEntryPrompt(id: SetupEntryId): SetupEntryPrompt {
  const entry = BY_ID[id];
  if (!entry) throw new Error(`unknown setup entry prompt: ${id}`);
  return entry;
}
