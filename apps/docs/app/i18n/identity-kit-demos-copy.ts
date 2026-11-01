/** English copy for the identity kit demos page. Keys only; no markup. */
export const identityKitDemosCopy = {
  metadata: {
    title: "Identity kit demos",
    description: "Internal harness for identity component previews.",
  },
  heading: "Identity kit demos",
  body: "Internal previews for tests and QA. Identities are a demo concern, not a docs feature.",
  scrollGuide: "Open the scroll scenes guide",
  afterScrollGuide: "to leave this harness.",
} as const;

export type IdentityKitDemosCopy = typeof identityKitDemosCopy;
