export const liveConsoleCopy = {
  metadata: {
    title: "Run",
    description: "Public live run console on zedkit.",
  },
  loading: "Loading this run",
  missingId: {
    title: "Run id missing",
    description: "Open this page from a run link. The address needs a run id.",
  },
  invalidId: {
    title: "Run not found",
    description: "This run id is not valid.",
  },
  unauthorized: {
    title: "This run is private",
    description: "Public pages only show runs that were published.",
  },
  notFound: {
    title: "Run not found",
    description: "This run is not on the public live console.",
  },
  error: {
    title: "Could not load this run",
    description: "The live console did not answer. Try again.",
  },
  retry: "Retry",
  live: "Live",
  idle: "Idle",
} as const;

export type LiveConsoleCopy = typeof liveConsoleCopy;
