export const reviewsCopy = {
  metadata: {
    list: {
      title: "Issues",
      description: "Public work log of how each issue was planned, built, and reviewed.",
    },
    issue: {
      title: "Issue",
      description: "Timeline of exportable runs for a public GitHub issue.",
    },
    unlinked: {
      title: "Unlinked pull request",
      description: "Exportable runs that are not joined to a GitHub issue yet.",
    },
    run: {
      title: "Run",
      description:
        "One exportable run. Live-backed runs open the shared console; others link to the hosted live console when a URL exists.",
    },
    missing: {
      title: "Issue not found",
      description: "This public issue is not in the list.",
    },
    unlinkedMissing: {
      title: "Unlinked pull request not found",
      description:
        "This URL is for unlinked pull requests. Linked PRs are listed on their issue page.",
    },
    runMissing: {
      title: "Run not found",
      description: "This run is not on the public list.",
    },
    reviewsMissing: {
      title: "Review page not found",
      description: "This review URL is not on the public list.",
    },
  },
  list: {
    title: "Issues",
    description: "Public work log of how each issue was planned, built, and reviewed.",
    empty: "No public runs yet",
    openList: "Issue list",
    missing: "This item is not on the public list.",
    missingNext: "Choose another from the list.",
    linkedPr: "Pull request",
    linkedPrs: "Pull requests",
    githubIssue: "Issue",
    githubPull: "PR",
    unlinkedTitle: "Unlinked pull requests",
    unlinkedDescription:
      "These runs are not joined to a GitHub issue yet. They stay reachable here and from old review URLs.",
    run: "run",
    runs: "runs",
    took: "Took",
    duration: "Duration",
    finished: "Finished",
    started: "Started",
    opensInNewTab: "opens in a new tab",
  },
  issue: {
    back: "All issues",
    timeline: "Timeline",
    replaced: "Replaced by newer run",
    failedReplaced: "Didn't finish — replaced by a later review",
    viewLog: "View log",
    // Defensive: zero-entry issues are dropped before render (toPublicIndex, createComposedReviewPort).
    timelineEmpty: "No exportable runs on this issue.",
    missing: "This issue is not on the public list.",
  },
  unlinked: {
    back: "All issues",
    title: "Unlinked pull request",
    missing:
      "This URL is for unlinked pull requests. Linked PRs are listed on their issue page.",
    // Defensive: zero-entry PRs are dropped before render (toPublicIndex, createComposedReviewPort).
    timelineEmpty: "No exportable runs on this pull request.",
  },
  loadError: {
    title: "Could not load public runs",
    description:
      "GitHub or the runs API did not answer. This page updates when the site is next published.",
  },
  run: {
    backToIssue: "Back to the issue",
    backToUnlinked: "Back to the pull request",
    backToList: "All issues",
    title: "Run",
    openLive: "Open the hosted live console (new tab)",
    noLive: "No hosted live console URL is available for this run.",
    missing: "This run is not on the public list.",
  },
  type: {
    plan: "Plan",
    implement: "Implementation",
    review: "Review",
    improve: "Follow-up after review",
    "dry-run": "Dry run",
  },
  status: {
    running: "Running",
    completed: "Completed",
    failed: "Didn't finish",
  },
  verdict: {
    approve: "Approved",
    "request-changes": "Changes requested",
    comment: "Comment",
  },
  state: {
    open: "Open",
    closed: "Closed",
  },
} as const;

export type ReviewsCopy = typeof reviewsCopy;
