/** English copy for the home six-sentences quote/reply band. Keys only; no markup. */
export const homeSixSentencesCopy = {
  section: {
    title: "Six sentences you stop hearing.",
    description: "Three about how the agent works. Three about what it draws.",
  },
  kit: {
    ai: "AI",
    ui: "UI",
  },
  cards: [
    {
      id: "quality",
      kit: "ai",
      label: "Quality",
      quote: "“Looks good to me.”",
      quoteAside: "Said the agent that wrote it.",
      replyTitle: "The one who writes never checks.",
      replyBody:
        "A separate verifier reads the diff cold. It has no stake in the code being right, which is the point.",
    },
    {
      id: "time",
      kit: "ai",
      label: "Time",
      quote: "“Let me first explore the codebase.”",
      quoteAside: "Every chat. Again.",
      replyTitle: "It learns your repo once.",
      replyBody:
        "Half an hour of reading, up to eight questions for you. After that, no session starts with the tour.",
    },
    {
      id: "fewer-bugs",
      kit: "ai",
      label: "Fewer bugs",
      quote: "“Done!”",
      quoteAside: "The tests were never run.",
      replyTitle: "Done has a definition.",
      replyBody:
        "Gates run, changed files tested, second review clean. Until then, the agent may not use the word.",
    },
    {
      id: "brand",
      kit: "ui",
      label: "Brand",
      quote: "“I went with a clean, modern blue.”",
      quoteAside: "Your brand is green.",
      replyTitle: "A look is one attribute.",
      replyBody:
        "Type, shape, density and color are set together. Six looks ship with the kit, or describe your own.",
    },
    {
      id: "finish",
      kit: "ui",
      label: "Finish",
      quote: "“The happy path works.”",
      quoteAside: "Nobody drew the empty state.",
      replyTitle: "The boring states already exist.",
      replyBody:
        "Loading, empty and error states are components in the kit, so they are there on day one.",
    },
    {
      id: "consistency",
      kit: "ui",
      label: "Consistency",
      quote: "“I created a new Button component.”",
      quoteAside: "You already had three.",
      replyTitle: "One way to do each thing.",
      replyBody: (componentCount: number) =>
        `${componentCount} components that already agree with each other. The agent reaches for them instead of inventing.`,
    },
  ],
} as const;
