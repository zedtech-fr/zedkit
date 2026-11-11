import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("catalog view reads as a catalog: lead, filters, results, no identity form", () => {
  const view = read("ui/catalog/catalog-view.tsx");
  assert.match(view, /\{catalogCopy\.header\.lead\}/);
  assert.match(view, /CatalogFiltersToolbar/);
  assert.match(view, /CatalogResultsBodyLazy/);
  assert.match(view, /catalogResultsStatusLine\(filtered\.length\)/);
  assert.doesNotMatch(view, /CatalogIdentity/);
  assert.doesNotMatch(view, /IdentityLookForm/);
  assert.doesNotMatch(view, /bindLookLibrary/);
  assert.doesNotMatch(view, /useDraftTokens/);
  assert.doesNotMatch(view, /ThemeScope/);
  const leadAt = view.indexOf("{catalogCopy.header.lead}");
  const toolbarAt = view.indexOf("<CatalogFiltersToolbar");
  const resultsAt = view.indexOf("catalogResultsStatusLine(filtered.length)");
  assert.equal(leadAt >= 0 && toolbarAt >= 0 && resultsAt >= 0, true);
  assert.equal(leadAt < toolbarAt, true);
  assert.equal(toolbarAt < resultsAt, true);
});

test("catalog ships no identity host module", () => {
  assert.equal(existsSync(join(app, "ui/catalog/catalog-identity.tsx")), false);
  const names = readdirSync(join(app, "ui/catalog")).map(String);
  assert.equal(
    names.filter((name) => /identity/i.test(name)).length,
    0,
  );
});

test("the identity form lives in the editor panel, not the catalog", () => {
  const panel = read("components/identity-editor-panel.tsx");
  const view = read("ui/catalog/catalog-view.tsx");
  assert.match(panel, /IdentityLookForm/);
  assert.match(panel, /defaultMode="expert"/);
  assert.match(panel, /bindLookLibrary/);
  assert.doesNotMatch(view, /defaultMode="simple"/);
});

test("the dock drawer is the customize form, with no Conversation tab or AI input", () => {
  const widget = read("components/identity-dock-widget.tsx");
  const panel = read("components/identity-dock-assistant-panel.tsx");
  const customize = read("components/identity-dock-customize.tsx");
  assert.match(widget, /IdentityDockAssistantPanel/);
  assert.match(panel, /IdentityDockCustomize/);
  assert.doesNotMatch(panel, /ViewSwitch/);
  assert.doesNotMatch(panel, /Conversation/);
  assert.doesNotMatch(panel, /IdentityDockComposerFooter/);
  assert.doesNotMatch(panel, /BriefForm/);
  assert.doesNotMatch(panel, /useIdentityDockAssistantPanel/);
  // The form itself: Classic/Expert IdentityLookForm, patching the dock preview tokens.
  assert.match(panel, /patchTokens/);
  assert.match(panel, /applyWidgetSpecimenPreview/);
  assert.match(customize, /IdentityLookForm/);
  assert.match(customize, /defaultMode="simple"/);
  assert.match(customize, /data-dock-customize/);
  assert.match(customize, /stickyTabs/);
  // Dock form fields must not reuse the editor's field ids on the editor page.
  assert.match(customize, /idPrefix="identity-dock"/);
  // Colour checker with Fix, and hints, inside the dock form.
  assert.match(customize, /ContrastChips/);
  assert.match(customize, /identityContrastWarnings\(props\.tokens\)/);
  assert.match(customize, /data-dock-contrast/);
});

test("the dock footer is Preview / Reset / Apply CTAs, not a text input", () => {
  const panel = read("components/identity-dock-assistant-panel.tsx");
  const bar = read("components/identity-dock-action-bar.tsx");
  const widget = read("components/identity-dock-widget.tsx");
  const hook = read("components/use-identity-dock-preview.ts");
  assert.match(panel, /IdentityDockActionBar/);
  assert.match(bar, /data-dock-action-bar/);
  assert.match(bar, /toolbar\.applySite/);
  assert.match(bar, /toolbar\.reset/);
  assert.match(bar, /dockCopy\.preview/);
  assert.doesNotMatch(bar, /Textarea|PromptInput|BriefForm/);
  assert.match(hook, /resetPreview/);
  assert.match(widget, /onResetPreview/);
  assert.match(panel, /onResetPreview/);
});
