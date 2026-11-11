export const reviewsCopy = {
  metadata: {
    list: {
      title: "Issues",
      description:
        "Public issues with exportable runs on zedkit. Switch identity, light or dark, and density on the page.",
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
      description: "One exportable run, with a link to the hosted live console when a URL exists.",
    },
    missing: {
      title: "Issue not found",
      description: "This public issue is not in the list.",
    },
  },
  list: {
    title: "Issues",
    description: "Public issues with at least one exportable run. The preview look stays on this section.",
    empty: "Public issues will show up here when the first exportable run exists.",
    openIssue: "Open issue",
    linkedPr: "Pull request",
    linkedPrs: "Pull requests",
    unlinkedTitle: "Unlinked pull requests",
    unlinkedDescription:
      "These runs are not joined to a GitHub issue yet. They stay reachable here and from old review URLs.",
    openUnlinked: "Open unlinked pull request",
  },
  issue: {
    back: "All issues",
    timeline: "Timeline",
    timelineEmpty: "No exportable runs on this issue.",
    openRun: "Open this run",
    missing: "This issue is not on the public list.",
  },
  unlinked: {
    back: "All issues",
    title: "Unlinked pull request",
    missing: "This unlinked pull request is not on the public list.",
  },
  run: {
    backToIssue: "Back to the issue",
    backToUnlinked: "Back to the pull request",
    backToList: "All issues",
    title: "Run",
    openLive: "Open the hosted live console",
    noLive: "No hosted live console URL is available for this run.",
    missing: "This run is not on the public list.",
  },
  appearance: {
    legend: "Preview look",
    hint: "This changes the issues preview, not the site.",
    identity: "Identity",
    mode: "Dark preview",
    density: "Density",
    densityDefault: "Default",
    densityCompact: "Compact",
    reset: "Reset",
    advanced: "Advanced token editor",
  },
  type: {
    plan: "Plan",
    implement: "Implement",
    review: "Review",
    improve: "Improve from review",
    "dry-run": "Dry run",
  },
  status: {
    running: "Running",
    completed: "Completed",
    failed: "Failed",
  },
  verdict: {
    approve: "Approve",
    "request-changes": "Request changes",
    comment: "Comment",
  },
  state: {
    open: "Open",
    closed: "Closed",
  },
} as const;

export type ReviewsCopy = typeof reviewsCopy;
