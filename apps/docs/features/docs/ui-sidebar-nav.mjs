/** Sidebar group labels, home-family order then leftover. */
const GROUPS = ["Actions", "Forms", "Overlays", "Data and states", "More"];

const SOURCE_SEGMENT_GROUP = {
  button: "Actions",
  actions: "Actions",
  forms: "Forms",
  combobox: "Forms",
  calendar: "Forms",
  overlays: "Overlays",
  drawer: "Overlays",
  feedback: "Data and states",
  "data-table": "Data and states",
  surfaces: "Data and states",
  transcript: "Data and states",
};

const NEED_GROUP_OVERRIDE = {
  "Show a status or count badge": "Actions",
  "Show toast notifications": "Actions",
  "Show key-value details and a live indicator": "Data and states",
};

/** Home “Find a component” example slugs, kept in that example order inside each group. */
const HOME_EXAMPLE_SLUGS = {
  Actions: [
    "trigger-actions-with-buttons",
    "icon-only-actions-with-a-visible-name",
    "show-a-status-or-count-badge",
    "show-toast-notifications",
  ],
  Forms: [
    "build-validated-forms-with-labels-errors-and-pending-state",
    "collect-text-input-with-a-label",
    "collect-multi-line-text-input",
    "pick-one-option-from-a-dropdown",
    "search-and-pick-one-option",
    "pick-many-searchable-options",
    "toggle-a-checkbox-or-a-switch",
    "pick-a-date-from-a-popover",
  ],
  Overlays: [
    "open-modal-dialogs",
    "confirm-destructive-actions",
    "slide-in-a-drawer-panel",
    "float-extra-content-next-to-a-control",
    "open-a-menu-of-actions-from-a-button",
    "name-a-control-on-hover",
    "render-a-route-as-a-modal-over-the-list",
  ],
  "Data and states": [
    "show-a-sortable-filterable-paginated-data-table",
    "show-key-value-details-and-a-live-indicator",
    "group-content-in-a-card-section",
    "show-an-empty-zone-with-a-next-step",
    "show-what-broke-and-a-next-step",
    "show-loading-placeholder-blocks",
  ],
};

function firstSourceSegment(source) {
  if (typeof source !== "string" || source.length === 0) return "";
  const slash = source.indexOf("/");
  return slash === -1 ? source : source.slice(0, slash);
}

export function uiSidebarGroupFor(need, source) {
  return NEED_GROUP_OVERRIDE[need] ?? SOURCE_SEGMENT_GROUP[firstSourceSegment(source)] ?? "More";
}

function groupForNeed(need, source) {
  return uiSidebarGroupFor(need, source);
}

/**
 * Fumadocs `meta.json` `pages` for the UI folder: separators plus slugs.
 * Installed fumadocs-core@16.17.10 parses `---Label---` as a sidebar heading.
 *
 * @param {{ needs: Array<{ need: string, slug: string }>, sourceByNeed?: Record<string, string | undefined>, omitNeed: (need: string) => boolean }} input
 * @returns {string[]}
 */
export function uiSidebarPages({ needs, sourceByNeed = {}, omitNeed }) {
  const published = [];
  const seen = new Set();
  for (const item of needs) {
    if (omitNeed(item.need)) continue;
    if (seen.has(item.slug)) {
      throw new Error(`ui sidebar: duplicate slug "${item.slug}"`);
    }
    seen.add(item.slug);
    published.push({ slug: item.slug, group: groupForNeed(item.need, sourceByNeed[item.need]) });
  }

  const pages = [];
  for (const group of GROUPS) {
    const members = published.filter((item) => item.group === group);
    if (members.length === 0) continue;
    pages.push(`---${group}---`);
    const used = new Set();
    const memberSlugs = new Set(members.map((item) => item.slug));
    for (const slug of HOME_EXAMPLE_SLUGS[group] ?? []) {
      if (!memberSlugs.has(slug)) continue;
      pages.push(slug);
      used.add(slug);
    }
    for (const item of members) {
      if (!used.has(item.slug)) pages.push(item.slug);
    }
  }
  return pages;
}
