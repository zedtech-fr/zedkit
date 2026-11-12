/**
 * English copy and sample data for the home looks specimen.
 * One compact Project settings screen; names are made up.
 */

export const homeIdentityExamplesCopy = {
  mist: {
    heading: "Project settings",
    description: "Name, region, and who gets incident mail.",
    status: "Active",
    workspaceLabel: "Workspace",
    workspaceValue: "Harbor Console",
    regionLabel: "Region",
    regionValue: "eu",
    regions: [
      { value: "eu", label: "Europe" },
      { value: "us", label: "Americas" },
      { value: "apac", label: "Asia-Pacific" },
    ],
    save: "Save changes",
    discard: "Discard",
    saved: "Changes saved.",
    discarded: "Changes discarded.",
    unsaved: "Unsaved changes.",
  },
} as const;
