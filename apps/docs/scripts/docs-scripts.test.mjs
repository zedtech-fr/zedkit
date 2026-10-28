import assert from "node:assert/strict";
import test from "node:test";
import { catalogPageKeys, expandFencePreviews, expandGuideSnippets } from "./generate.mjs";
import { checkGeneratedPage, readFrontmatterDescription } from "./page-checks.mjs";

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
  const out = expandFencePreviews(source, "../../components/component-preview");
  assert.match(out, /import \{ ComponentPreview \} from "\.\.\/\.\.\/components\/component-preview"/);
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
