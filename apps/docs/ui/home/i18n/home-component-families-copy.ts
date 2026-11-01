export const homeComponentFamiliesCopy = {
  section: {
    title: "Find a component",
    description: (componentCount: number) =>
      `${componentCount} UI entries in the catalog. Pick a family, then open a live doc page.`,
    browseAll: "Browse all UI in the catalog",
    arrow: "→",
  },
  families: [
    {
      label: "Actions",
      blurb: "Buttons, badges, and icon actions.",
      href: "/catalog?area=ui&q=button",
      examples: [
        { label: "Button", href: "/docs/ui/trigger-actions-with-buttons" },
        { label: "Badge", href: "/catalog?area=ui&q=badge" },
        { label: "Icon button", href: "/catalog?area=ui&q=icon" },
        { label: "Confirm dialog", href: "/catalog?area=ui&q=confirm" },
      ],
    },
    {
      label: "Forms",
      blurb: "Inputs, selects, labels, and validated forms.",
      href: "/catalog?area=ui&q=form",
      examples: [
        { label: "Input", href: "/catalog?area=ui&q=input" },
        { label: "Select", href: "/catalog?area=ui&q=select" },
        { label: "Form", href: "/catalog?area=ui&q=form" },
        { label: "Checkbox", href: "/catalog?area=ui&q=checkbox" },
      ],
    },
    {
      label: "Overlays",
      blurb: "Dialogs, drawers, popovers, and menus.",
      href: "/catalog?area=ui&q=dialog",
      examples: [
        { label: "Dialog", href: "/catalog?area=ui&q=dialog" },
        { label: "Drawer", href: "/catalog?area=ui&q=drawer" },
        { label: "Popover", href: "/catalog?area=ui&q=popover" },
        { label: "Dropdown menu", href: "/catalog?area=ui&q=dropdown" },
      ],
    },
    {
      label: "Data",
      blurb: "Tables, detail panels, and list states.",
      href: "/docs/ui/show-a-sortable-filterable-paginated-data-table",
      examples: [
        { label: "Data table", href: "/docs/ui/show-a-sortable-filterable-paginated-data-table" },
        { label: "Detail panel", href: "/catalog?area=ui&q=detail" },
        { label: "Empty state", href: "/catalog?area=ui&q=empty" },
        { label: "Pagination", href: "/catalog?area=ui&q=pagination" },
      ],
    },
  ],
} as const;
