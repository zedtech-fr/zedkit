import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

function functionSource(src, name) {
  const start = src.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const next = src.slice(start + 1).search(/\nfunction |\nexport function /);
  return next === -1 ? src.slice(start) : src.slice(start, start + 1 + next);
}

test("catalog view reads as a catalog: lead, counters, filters, results, no identity form", () => {
  const view = read("app/(site)/catalog/_catalog/catalog-view.tsx");
  assert.match(view, /catalogCopy\.header\.lead\(entries\.length\)/);
  assert.match(view, /CatalogCounters/);
  assert.match(view, /CatalogFiltersToolbar/);
  assert.match(view, /CatalogResultsBodyLazy/);
  assert.match(view, /catalogResultsStatusLine\(visible\.length, areaTotal\)/);
  assert.doesNotMatch(view, /CatalogIdentity/);
  assert.doesNotMatch(view, /IdentityLookForm/);
  assert.doesNotMatch(view, /bindLookLibrary/);
  assert.doesNotMatch(view, /useDraftTokens/);
  assert.doesNotMatch(view, /ThemeScope/);
  const leadAt = view.indexOf("catalogCopy.header.lead(entries.length)");
  const countersAt = view.indexOf("<CatalogCounters");
  const toolbarAt = view.indexOf("<CatalogFiltersToolbar");
  const resultsAt = view.indexOf("<CatalogResultsBodyLazy");
  const statusAt = view.indexOf("catalogResultsStatusLine(visible.length, areaTotal)");
  assert.equal(
    leadAt >= 0 && countersAt >= 0 && toolbarAt >= 0 && resultsAt >= 0 && statusAt >= 0,
    true,
  );
  assert.equal(leadAt < countersAt, true);
  assert.equal(countersAt < toolbarAt, true);
  assert.equal(toolbarAt < resultsAt, true);
  assert.equal(resultsAt < statusAt, true);
});

test("catalog header is a muted band with a hairline; search sits in the next section", () => {
  const view = read("app/(site)/catalog/_catalog/catalog-view.tsx");
  const css = read("app/(site)/catalog/_catalog/catalog-shell.css");
  const headerAt = view.indexOf("data-catalog-header-band");
  const mutedAt = view.indexOf('tone="muted"');
  const toolbarAt = view.indexOf("<CatalogFiltersToolbar");
  const resultsAt = view.indexOf("<CatalogResultsBodyLazy");
  assert.equal(headerAt >= 0 && mutedAt >= 0 && toolbarAt >= 0 && resultsAt >= 0, true);
  assert.equal(mutedAt < headerAt, true);
  assert.equal(headerAt < toolbarAt, true);
  assert.equal(toolbarAt < resultsAt, true);
  assert.match(view, /data-catalog-header-band/);
  assert.match(css, /\[data-catalog-header-band\]/);
  assert.match(css, /--zk-border-width/);
  assert.match(css, /var\(--border\)/);
  assert.doesNotMatch(view, /#FAFAFA/);
  assert.doesNotMatch(css, /#FAFAFA/);
  const headerSlice = view.slice(mutedAt, toolbarAt);
  assert.match(headerSlice, /data-catalog-header-band/);
  assert.match(headerSlice, /<CatalogCounters/);
  assert.doesNotMatch(headerSlice, /CatalogFiltersToolbar/);
});

test("selected chip uses site-action; chips and Stable only share one wrap row", () => {
  const filters = read("app/(site)/catalog/_catalog/catalog-filters.tsx");
  assert.match(filters, /data-site-action=\{selected \? "" : undefined\}/);
  assert.match(filters, /variant=\{selected \? "default" : "outline"\}/);
  assert.match(filters, /data-catalog-chip-row/);
  assert.match(filters, /ms-auto/);
  assert.doesNotMatch(filters, /xl:ms-auto/);
  const rowStart = filters.indexOf("data-catalog-chip-row");
  assert.notEqual(rowStart, -1);
  const rowSlice = filters.slice(rowStart);
  const chipsAt = rowSlice.indexOf("CatalogCategoryChips");
  const stableAt = rowSlice.indexOf("CatalogStableOnly");
  assert.equal(chipsAt >= 0 && stableAt >= 0, true);
  assert.equal(chipsAt < stableAt, true);
});

test("category chips override size=sm caption with text-dense", () => {
  const chips = functionSource(read("app/(site)/catalog/_catalog/catalog-filters.tsx"), "CatalogCategoryChips");
  assert.match(chips, /size="sm"/);
  assert.match(chips, /text-dense/);
});

test("Category group holds chips only; toolbar is a labelled group", () => {
  const filters = read("app/(site)/catalog/_catalog/catalog-filters.tsx");
  const chips = functionSource(filters, "CatalogCategoryChips");
  const stable = functionSource(filters, "CatalogStableOnly");
  const toolbar = functionSource(filters, "CatalogFiltersToolbar");
  assert.match(chips, /role="group"/);
  assert.match(chips, /chipsAriaLabel/);
  assert.doesNotMatch(chips, /CatalogStableOnly/);
  assert.doesNotMatch(chips, /Checkbox/);
  assert.match(stable, /htmlFor="catalog-stable-only"/);
  assert.match(stable, /id="catalog-stable-only"/);
  assert.doesNotMatch(stable, /aria-label/);
  assert.match(toolbar, /role="group"/);
  assert.match(toolbar, /toolbarAriaLabel/);
  assert.doesNotMatch(toolbar, /role="toolbar"/);
  assert.doesNotMatch(toolbar, /chipsAriaLabel/);
});

test("catalog search shadow is owned by the Input class, not catalog-shell.css", () => {
  const search = functionSource(read("app/(site)/catalog/_catalog/catalog-filters.tsx"), "CatalogSearchField");
  const css = read("app/(site)/catalog/_catalog/catalog-shell.css");
  const start = css.indexOf("[data-catalog-filter-search]");
  assert.notEqual(start, -1);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  assert.match(search, /className="shadow-none"/);
  assert.doesNotMatch(css.slice(start, close + 1), /box-shadow/);
});

test("results status is a data hook, not a heading id", () => {
  const view = read("app/(site)/catalog/_catalog/catalog-view.tsx");
  assert.match(view, /data-catalog-results-heading/);
  assert.doesNotMatch(view, /id="catalog-results-heading"/);
});

test("catalog cells use compact padding", () => {
  const results = read("app/(site)/catalog/_catalog/catalog-results.tsx");
  assert.match(results, /surface-pad-compact/);
  assert.doesNotMatch(results, /surface-pad-md/);
});

test("catalog title links floor the 24px hit target without shrinking to zero", () => {
  const results = read("app/(site)/catalog/_catalog/catalog-results.tsx");
  const css = read("app/(site)/catalog/_catalog/catalog-shell.css");
  const cell = functionSource(results, "CatalogCell");
  const titleClass = cell.match(/data-catalog-title=""\s+className="([^"]+)"/);
  assert.equal(titleClass !== null, true);
  assert.match(titleClass[1], /hit-target/);
  assert.doesNotMatch(titleClass[1], /content-shrink/);
  assert.match(css, /\[data-catalog-title\]/);
  assert.match(css, /min-width:\s*24px/);
});

test("catalog result cells lift on hover and focus; counters stay still", () => {
  const results = read("app/(site)/catalog/_catalog/catalog-results.tsx");
  const counters = read("app/(site)/catalog/_catalog/catalog-counters.tsx");
  const cell = functionSource(results, "CatalogCell");
  assert.match(cell, /data-catalog-cell=/);
  assert.match(cell, /hover-lift/);
  assert.match(cell, /focus-ring/);
  // Shared Surface grid: cells are borderless, so hover-lift is lift/shadow only.
  assert.doesNotMatch(cell, /<Card|<Surface/);
  assert.doesNotMatch(counters, /hover-lift/);
});

test("catalog ships no identity host module", () => {
  assert.equal(existsSync(join(app, "app/(site)/catalog/_catalog/catalog-identity.tsx")), false);
  const names = readdirSync(join(app, "app/(site)/catalog/_catalog")).map(String);
  assert.equal(
    names.filter((name) => /identity/i.test(name)).length,
    0,
  );
});

test("the identity form lives in the editor panel, not the catalog", () => {
  const panel = read("features/identity/editor/ui/identity-editor-panel.tsx");
  const view = read("app/(site)/catalog/_catalog/catalog-view.tsx");
  assert.match(panel, /IdentityLookForm/);
  assert.match(panel, /defaultMode="expert"/);
  assert.match(panel, /bindLookLibrary/);
  assert.doesNotMatch(view, /defaultMode="simple"/);
});

test("the dock drawer is the customize form, with no Conversation tab or AI input", () => {
  const widget = read("features/identity/dock/ui/identity-dock-widget.tsx");
  const panel = read("features/identity/dock/ui/identity-dock-assistant-panel.tsx");
  const customize = read("features/identity/dock/ui/identity-dock-customize.tsx");
  assert.match(widget, /IdentityDockAssistantPanel/);
  assert.match(panel, /IdentityDockCustomize/);
  assert.doesNotMatch(panel, /ViewSwitch/);
  assert.doesNotMatch(panel, /Conversation/);
  assert.doesNotMatch(panel, /IdentityDockComposerFooter/);
  assert.doesNotMatch(panel, /BriefForm/);
  assert.doesNotMatch(panel, /useIdentityDockAssistantPanel/);
  // The form itself: Classic/Expert IdentityLookForm, patching the live site look.
  assert.match(panel, /patchTokens/);
  assert.match(panel, /applyDocsSiteLook/);
  assert.doesNotMatch(panel, /applyWidgetSpecimenPreview/);
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
  assert.match(panel, /dispatchIdentityEditorDraftApply/);
  assert.doesNotMatch(read("features/identity/ui/identity-editor-draft-apply.ts"), /Use this look/);
  assert.doesNotMatch(read("features/identity/dock/ui/use-creator-handoff.ts"), /placed in the form|form is filled/);
  assert.doesNotMatch(read("features/identity/dock/i18n/identity-assistant-copy.ts"), /preview above/);
});

test("the dock footer is Reset only, not Apply or Preview", () => {
  const panel = read("features/identity/dock/ui/identity-dock-assistant-panel.tsx");
  const bar = read("features/identity/dock/ui/identity-dock-action-bar.tsx");
  const copy = read("features/identity/dock/i18n/identity-dock-copy.ts");
  const editorCopy = read("features/identity/editor/i18n/identity-editor-copy.ts");
  assert.match(panel, /IdentityDockActionBar/);
  assert.match(bar, /data-dock-action-bar/);
  assert.match(bar, /toolbar\.reset/);
  assert.match(bar, /aria-live="polite"/);
  assert.doesNotMatch(bar, /toolbar\.applySite/);
  assert.doesNotMatch(bar, /dockCopy\.preview/);
  assert.doesNotMatch(bar, /removeFromSite/);
  assert.doesNotMatch(bar, /onApplySite|onPreview|onRemoveFromSite/);
  assert.doesNotMatch(copy, /^\s*close:/m);
  assert.doesNotMatch(copy, /preview:/);
  assert.doesNotMatch(editorCopy, /applySite:/);
  assert.doesNotMatch(editorCopy, /removeFromSite:/);
  assert.doesNotMatch(editorCopy, /applyHint:/);
  assert.doesNotMatch(editorCopy, /applied:/);
  assert.doesNotMatch(bar, /Textarea|PromptInput|BriefForm/);
  const widget = read("features/identity/dock/ui/identity-dock-widget.tsx");
  assert.match(widget, /panelRef\.current\?\.focus\(\)/);
  assert.doesNotMatch(widget, /aria-label="Drag to resize"/);
});

test("the custom identity bar is Reset when the look differs, not a separate apply step", () => {
  const copy = read("features/identity/dock/i18n/custom-identity-bar-copy.ts");
  const bar = read("features/identity/dock/ui/custom-identity-bar.tsx");
  assert.match(copy, /badge: "Custom identity active"/);
  assert.match(copy, /reset: "Reset"/);
  assert.doesNotMatch(copy, /You applied/);
  assert.doesNotMatch(copy, /to the whole site/);
  assert.match(bar, /docsSiteLookDiffersFromDefaults/);
  assert.match(bar, /resetDocsSiteLook/);
  assert.doesNotMatch(bar, /isDocsSiteIdentityOptIn/);
  assert.doesNotMatch(bar, /optIn/);
});
