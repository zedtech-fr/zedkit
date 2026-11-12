import assert from "node:assert/strict";
import test from "node:test";
import { catalogPageKeys, expandFencePreviews, expandGuideSnippets } from "./generate.mjs";
import { checkGeneratedPage, readFrontmatterDescription, readFrontmatterTitle } from "./page-checks.mjs";
import { componentPageHeaderMeta, componentPageSections } from "../features/docs/component-page-sections.mjs";
import { declarationOrigin } from "../features/docs/declared-props.mjs";
import { partitionPropsEntries } from "../features/docs/props-priority.mjs";
import { uiSidebarGroupFor, uiSidebarPages } from "../lib/ui-sidebar-nav.mjs";
import { docsLayoutTree } from "../lib/docs-layout-tree.mjs";
import { kitUiSourceUrl, SITE_GITHUB_URL } from "../lib/site-links.mjs";

const page = `---
title: "Trigger actions with buttons"
description: "A button starts an action."
status: beta
---

## At a glance

- **Who:** Teams shipping actions
- **What:** A labeled button
- **Use when:** The user starts something
- **Avoid when:** The target is a link

<Tabs groupId="package-manager" persist items={["pnpm", "npm", "yarn"]}>
  <Tab value="pnpm">pnpm add @zedtech/zedkit-ui</Tab>
</Tabs>

\`\`\`tsx title="Usage"
<Button>Save</Button>
\`\`\`
`;

test("partitionPropsEntries surfaces variant and size before inherited attrs", () => {
  const entries = [
    { name: "disabled" },
    { name: "variant" },
    { name: "size" },
    { name: "asChild" },
    { name: "type" },
  ];
  const { primary, inherited } = partitionPropsEntries(entries);
  assert.deepEqual(
    primary.map((entry) => entry.name),
    ["variant", "size", "asChild"],
  );
  assert.deepEqual(
    inherited.map((entry) => entry.name),
    ["disabled", "type"],
  );
});

test("partitionPropsEntries keeps required and kit-declared props, folds inherited ones", () => {
  const entries = [
    { name: "title", origin: "inherited" },
    { name: "label", required: true, origin: "inherited" },
    { name: "tone", origin: "kit" },
    { name: "onClick", origin: "inherited" },
    { name: "size", origin: "inherited" },
  ];
  const { primary, inherited } = partitionPropsEntries(entries, ["size"]);
  assert.deepEqual(primary.map((e) => e.name), ["label", "size", "tone"]);
  assert.deepEqual(inherited.map((e) => e.name), ["onClick", "title"]);
});

test("partitionPropsEntries in only-mode folds everything but the priority list", () => {
  const entries = [
    { name: "required", required: true, origin: "kit" },
    { name: "variant", origin: "kit" },
    { name: "other", origin: "kit" },
  ];
  const { primary, inherited } = partitionPropsEntries(entries, ["variant"], true);
  assert.deepEqual(primary.map((e) => e.name), ["variant"]);
  assert.deepEqual(inherited.map((e) => e.name), ["other", "required"]);
});

test("declarationOrigin follows where a property is declared", () => {
  const react = "/repo/node_modules/.pnpm/@types+react@19/node_modules/@types/react/index.d.ts";
  const lib = "/repo/node_modules/typescript/lib/lib.dom.d.ts";
  const kit = "/repo/packages/ui/src/layout/layout.tsx";
  assert.equal(declarationOrigin([react]), "inherited");
  assert.equal(declarationOrigin([lib]), "inherited");
  assert.equal(
    declarationOrigin(["/repo/node_modules/.pnpm/react-hook-form@7/node_modules/react-hook-form/dist/types/controller.d.ts"]),
    "kit",
    "a wrapped library's own option is the component's API, not an element attribute",
  );
  assert.equal(declarationOrigin([kit]), "kit");
  assert.equal(declarationOrigin([react, kit]), "kit", "a kit redeclaration of a native name is the kit's option");
  assert.equal(declarationOrigin([]), "inherited");
});

test("componentPageSections lists a section only when it has content", () => {
  const always = ["example", "usage-and-states", "install-or-copy", "guidance"];
  const sections = componentPageSections({ hasProps: false, a11y: "", related: [], troubleshooting: "" });
  assert.deepEqual(sections, always);
  assert.ok(sections.indexOf("example") < sections.indexOf("usage-and-states"));
  assert.ok(sections.indexOf("usage-and-states") < sections.indexOf("install-or-copy"));
  assert.ok(sections.indexOf("install-or-copy") < sections.indexOf("guidance"));
  const withProps = componentPageSections({
    hasProps: true,
    a11y: "Name it.",
    related: [{ title: "x" }],
    troubleshooting: "Wire the CSS.",
  });
  assert.deepEqual(withProps, [...always, "props", "accessibility", "related", "troubleshooting"]);
  assert.ok(withProps.indexOf("usage-and-states") < withProps.indexOf("install-or-copy"));
  assert.ok(withProps.indexOf("install-or-copy") < withProps.indexOf("guidance"));
  assert.ok(withProps.indexOf("guidance") < withProps.indexOf("props"));
  assert.deepEqual(componentPageSections({ hasProps: false, a11y: "Name it." }), [...always, "accessibility"]);
});

test("component page header keeps Stable maturity, package, and wraps", () => {
  const header = componentPageHeaderMeta({
    status: "stable",
    purpose: "A labeled button starts an action.",
    packageName: "@zedtech/zedkit-ui",
    wraps: "`@radix-ui/react-slot`",
  });
  assert.equal(header.maturity, "stable");
  assert.equal(header.purpose, "A labeled button starts an action.");
  assert.equal(header.packageName, "@zedtech/zedkit-ui");
  assert.equal(header.wraps, "`@radix-ui/react-slot`");
});

test("catalogPageKeys maps a need to folder/slug and suffixes collisions", () => {
  const keys = catalogPageKeys({
    packages: {
      "@zedtech/zedkit-ui": {
        needs: [{ need: "Trigger actions with buttons" }, { need: "Trigger actions with buttons" }],
      },
    },
  });
  assert.deepEqual(
    [...keys].sort(),
    ["ui/trigger-actions-with-buttons", "ui/trigger-actions-with-buttons-2"],
  );
});

test("expandFencePreviews inserts a live preview and optional import", () => {
  const source = '---\ntitle: "Demo"\n---\n\n```tsx preview="ButtonDemo"\n<Button />\n```\n';
  const out = expandFencePreviews(source, "../../features/docs/ui/component-preview");
  assert.match(out, /import \{ ComponentPreview \} from "\.\.\/\.\.\/features\/docs\/ui\/component-preview"/);
  assert.match(out, /<ComponentPreview demo="ButtonDemo"/);
  assert.match(out, /```tsx\n<Button \/>/);
  assert.equal(out.includes('preview="ButtonDemo"'), false);
});

test("expandGuideSnippets throws when the snippet file is missing", () => {
  assert.throws(() => expandGuideSnippets("{{snippet:does-not-exist.sh}}"), /guide snippet missing: does-not-exist\.sh/);
});

test("checkGeneratedPage accepts a full need page", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/trigger-actions-with-buttons.mdx",
    page,
    { seoMax: 160, descriptionsSeen: new Map() },
    errors,
  );
  assert.deepEqual(errors, []);
  assert.equal(readFrontmatterDescription(page), "A button starts an action.");
  assert.equal(readFrontmatterTitle(page), "Trigger actions with buttons");
});

test("checkGeneratedPage fails when catalog accessibility is not rendered", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/trigger-actions-with-buttons.mdx",
    page,
    {
      seoMax: 160,
      descriptionsSeen: new Map(),
      a11yByTitle: new Map([["Trigger actions with buttons", "Native button semantics."]]),
    },
    errors,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks the catalog Accessibility section")),
    true,
  );
});

test("checkGeneratedPage fails when a component page lacks the guidance block", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/confirm-destructive-actions.mdx",
    "---\ntitle: \"ConfirmDialog\"\ndescription: \"A destructive confirmation.\"\nstatus: beta\n---\n\n<ComponentPage registry={\"confirm-dialog\"} />\n",
    { seoMax: 160, descriptionsSeen: new Map() },
    errors,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks ComponentPage guidance prop")),
    true,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks sourceFile")),
    true,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks navGroup")),
    true,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks install tabs")),
    false,
  );
});

test("checkGeneratedPage fails when install tabs or description are missing", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/broken.mdx",
    "---\ntitle: \"Broken\"\n---\n\n## At a glance\n",
    { seoMax: 160, descriptionsSeen: new Map() },
    errors,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks description frontmatter")),
    true,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks install tabs")),
    true,
  );
});

test("checkGeneratedPage fails when the description exceeds 160 characters", () => {
  const errors = [];
  const long = "A".repeat(161);
  checkGeneratedPage(
    "ui/too-long.mdx",
    `---\ntitle: "Too long"\ndescription: ${JSON.stringify(long)}\n---\n\n## At a glance\n\n- **Who:** Who\n- **What:** What\n- **Use when:** When\n- **Avoid when:** Avoid\n\n<Tabs groupId="package-manager" persist items={["pnpm"]}>\n  <Tab value="pnpm">pnpm add @zedtech/zedkit-ui</Tab>\n</Tabs>\n`,
    { seoMax: 160, descriptionsSeen: new Map() },
    errors,
  );
  assert.equal(
    errors.some((entry) => entry.includes("description exceeds 160 characters")),
    true,
  );
});

test("checkGeneratedPage reports a duplicate description", () => {
  const seen = new Map();
  const errors = [];
  checkGeneratedPage("ui/a.mdx", page, { seoMax: 160, descriptionsSeen: seen }, errors);
  checkGeneratedPage("ui/b.mdx", page, { seoMax: 160, descriptionsSeen: seen }, errors);
  assert.equal(
    errors.some((entry) => entry.includes("duplicate description on ui/b.mdx and ui/a.mdx")),
    true,
  );
});

function slugsOf(pages) {
  return pages.filter((entry) => !/^---.+---$/.test(entry));
}

test("uiSidebarPages groups Badge, Toaster, and DetailPanel with home-example order", () => {
  const pages = uiSidebarPages({
    needs: [
      { need: "Show a status or count badge", slug: "show-a-status-or-count-badge" },
      { need: "Trigger actions with buttons", slug: "trigger-actions-with-buttons" },
      { need: "Collect text input with a label", slug: "collect-text-input-with-a-label" },
      { need: "Open modal dialogs", slug: "open-modal-dialogs" },
      { need: "Slide in a drawer panel", slug: "slide-in-a-drawer-panel" },
      { need: "Show toast notifications", slug: "show-toast-notifications" },
      { need: "Show key-value details and a live indicator", slug: "show-key-value-details-and-a-live-indicator" },
      { need: "Lay out an admin page (sidebar + topbar + header)", slug: "lay-out-an-admin-page-sidebar-topbar-header" },
    ],
    sourceByNeed: {
      "Show a status or count badge": "feedback/badge.tsx",
      "Trigger actions with buttons": "button/button.tsx",
      "Collect text input with a label": "forms/input.tsx",
      "Open modal dialogs": "overlays/dialog.tsx",
      "Slide in a drawer panel": "drawer/drawer.tsx",
      "Show toast notifications": "feedback/sonner.tsx",
      "Show key-value details and a live indicator": "layout/detail-panel.tsx",
      "Lay out an admin page (sidebar + topbar + header)": "layout/app-shell.tsx",
    },
  });
  assert.deepEqual(pages, [
    "---Actions---",
    "trigger-actions-with-buttons",
    "show-a-status-or-count-badge",
    "show-toast-notifications",
    "---Forms---",
    "collect-text-input-with-a-label",
    "---Overlays---",
    "open-modal-dialogs",
    "slide-in-a-drawer-panel",
    "---Data and states---",
    "show-key-value-details-and-a-live-indicator",
    "---More---",
    "lay-out-an-admin-page-sidebar-topbar-header",
  ]);
});

test("uiSidebarPages drops omitted identity needs and sends unknown source to More", () => {
  const pages = uiSidebarPages({
    needs: [
      { need: "Design your identity", slug: "design-your-identity" },
      { need: "Switch the visual identity with one attribute", slug: "switch-the-visual-identity-with-one-attribute" },
      { need: "A need with no source", slug: "a-need-with-no-source" },
      { need: "Brand the header", slug: "brand-the-header" },
    ],
    sourceByNeed: {
      "Brand the header": "brand/brand-logo.tsx",
    },
  });
  assert.deepEqual(pages, [
    "---More---",
    "a-need-with-no-source",
    "brand-the-header",
  ]);
  assert.equal(pages.includes("design-your-identity"), false);
  assert.equal(pages.includes("switch-the-visual-identity-with-one-attribute"), false);
});

test("uiSidebarPages skips an empty group and lists every published slug once", () => {
  const needs = [
    { need: "Collect text input with a label", slug: "collect-text-input-with-a-label" },
    { need: "Lay out an admin page (sidebar + topbar + header)", slug: "lay-out-an-admin-page-sidebar-topbar-header" },
  ];
  const pages = uiSidebarPages({
    needs,
    sourceByNeed: {
      "Collect text input with a label": "forms/input.tsx",
      "Lay out an admin page (sidebar + topbar + header)": "layout/app-shell.tsx",
    },
  });
  assert.deepEqual(pages, [
    "---Forms---",
    "collect-text-input-with-a-label",
    "---More---",
    "lay-out-an-admin-page-sidebar-topbar-header",
  ]);
  assert.equal(pages.includes("---Actions---"), false);
  assert.deepEqual(slugsOf(pages).sort(), needs.map((item) => item.slug).sort());
  assert.equal(new Set(slugsOf(pages)).size, slugsOf(pages).length);
  assert.equal(
    slugsOf(pages).some((slug) => slug.includes("/")),
    false,
  );
});

test("uiSidebarPages throws on a duplicate slug", () => {
  assert.throws(
    () =>
      uiSidebarPages({
        needs: [
          { need: "Trigger actions with buttons", slug: "shared" },
          { need: "Collect text input with a label", slug: "shared" },
        ],
        sourceByNeed: {
          "Trigger actions with buttons": "button/button.tsx",
          "Collect text input with a label": "forms/input.tsx",
        },
      }),
    /duplicate slug "shared"/,
  );
});

test("uiSidebarPages does not throw for a new source folder", () => {
  const pages = uiSidebarPages({
    needs: [{ need: "Motion helper", slug: "motion-helper" }],
    sourceByNeed: { "Motion helper": "motion.css" },
  });
  assert.deepEqual(pages, ["---More---", "motion-helper"]);
});

test("uiSidebarGroupFor maps Button to Actions", () => {
  assert.equal(uiSidebarGroupFor("Trigger actions with buttons", "button/button.tsx"), "Actions");
  assert.equal(uiSidebarGroupFor("Show a status or count badge", "feedback/badge.tsx"), "Actions");
  assert.equal(uiSidebarGroupFor("Unknown need", "mystery/x.tsx"), "More");
});

test("docsLayoutTree on a UI slug is the job-grouped folder, not package folders", () => {
  const root = {
    name: "Docs",
    children: [
      { type: "page", name: "Getting started", url: "/docs/getting-started" },
      {
        type: "folder",
        $id: "ui",
        name: "@zedtech/zedkit-ui",
        children: [
          { type: "separator", name: "Actions" },
          { type: "page", name: "Button", url: "/docs/ui/trigger-actions-with-buttons" },
          { type: "separator", name: "Forms" },
        ],
      },
      {
        type: "folder",
        $id: "ai",
        name: "@zedtech/zedkit-ai",
        children: [{ type: "page", name: "Setup", url: "/docs/ai/setup" }],
      },
    ],
  };
  const ui = docsLayoutTree(root, ["ui", "trigger-actions-with-buttons"]);
  assert.deepEqual(
    ui.children.map((node) => node.name),
    ["Actions", "Button", "Forms"],
  );
  assert.equal(
    ui.children.some((node) => node.name === "Getting started" || node.$id === "ai"),
    false,
  );
  const guides = docsLayoutTree(root, ["getting-started"]);
  assert.equal(guides, root);
  assert.equal(docsLayoutTree(root, []), root);
});

test("kitUiSourceUrl points at the kit file on GitHub", () => {
  assert.equal(
    kitUiSourceUrl("button/button.tsx"),
    `${SITE_GITHUB_URL}/blob/main/packages/ui/src/button/button.tsx`,
  );
  assert.equal(kitUiSourceUrl(""), null);
  assert.equal(kitUiSourceUrl("../secret"), null);
});
