export const reviewsCopy = {
  metadata: {
    list: {
      title: "Reviews",
      description:
        "Public pull request reviews on zedkit. Switch identity, light or dark, and density on the page.",
    },
    pr: {
      title: "Review",
      description: "Final decision, remaining merge blockers when they exist, and run history for a public pull request.",
    },
    run: {
      title: "Review run",
      description: "One review run, with links back to the pull request and the list.",
    },
    missing: {
      title: "Review not found",
      description: "This public review is not in the list.",
    },
  },
  list: {
    title: "Reviews",
    description: "Public pull request reviews. The preview look stays on this section.",
    search: "Search title, number, or SHA",
    state: "Pull request state",
    stateAll: "Open and merged",
    stateOpen: "Open",
    stateMerged: "Merged",
    verdict: "Verdict",
    verdictAll: "Every verdict",
    empty: "No public reviews yet. When the first one is published, it will show up here.",
    noneMatch: "No reviews match these filters.",
    openPr: "Open pull request",
    runHistory: "Run history",
  },
  pr: {
    back: "All reviews",
    confidence: "Confidence",
    mustChange: "Must change before merge",
    firstPass: "First pass",
    outdated: "Outdated",
    evidence: "Evidence",
    notes: "Notes",
    notesEmpty: "No notes on this review.",
    runs: "Run history",
    runsEmpty: "No runs on this review.",
    openRun: "Open this run",
    agentDetail: "Agent detail",
    agentDetailEmpty: "Lenses, second pass, and transcripts will load here on demand.",
    missing: "This review is not on the public list.",
  },
  run: {
    backToPr: "Back to the pull request",
    backToList: "All reviews",
    title: "Run",
    missing: "This run is not on the public list.",
  },
  appearance: {
    legend: "Preview look",
    hint: "This changes the review preview, not the site.",
    identity: "Identity",
    mode: "Dark preview",
    density: "Density",
    densityDefault: "Default",
    densityCompact: "Compact",
    reset: "Reset",
    advanced: "Advanced token editor",
  },
  verdict: {
    approve: "Approve",
    "request-changes": "Request changes",
    comment: "Comment",
    error: "Error",
  },
  status: {
    running: "Running",
    done: "Done",
    error: "Error",
  },
  prState: {
    open: "Open",
    merged: "Merged",
  },
  disposition: {
    kept: "Kept",
    downgraded: "Downgraded",
    dismissed: "Dismissed",
  },
} as const;

export type ReviewsCopy = typeof reviewsCopy;
