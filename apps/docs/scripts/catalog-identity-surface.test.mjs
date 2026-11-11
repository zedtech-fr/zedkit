import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("catalog identity host does not import Muse generate or dock-apply", () => {
  const host = read("ui/catalog/catalog-identity.tsx");
  assert.doesNotMatch(host, /identity-assistant/);
  assert.doesNotMatch(host, /identity-dock/);
  assert.doesNotMatch(host, /IDENTITY_EDITOR_DRAFT_APPLY/);
  assert.doesNotMatch(host, /suggestIdentityTokens/);
  assert.doesNotMatch(host, /applyCustomIdentity/);
  assert.doesNotMatch(host, /applySite/);
  assert.match(host, /bindLookLibrary/);
  assert.match(host, /IdentityEditorKeepBar/);
  assert.match(host, /IdentityLookForm/);
  assert.match(host, /defaultMode="simple"/);
});

test("catalog KeepBar omits apply-to-site", () => {
  const host = read("ui/catalog/catalog-identity.tsx");
  assert.match(host, /IdentityEditorKeepBar/);
  assert.doesNotMatch(host, /onApplySite/);
  assert.doesNotMatch(host, /ApplySiteRow/);
});

test("catalog look SelectTrigger has an accessible name from toolbar.look", () => {
  const host = read("ui/catalog/catalog-identity.tsx");
  assert.match(host, /aria-label=\{identityEditorCopy\.toolbar\.look\}/);
  assert.match(host, /data-identity-look-control/);
});

test("Simple fields patch the preview scheme, not always light", () => {
  const form = read("components/identity-look-form.tsx");
  assert.match(form, /value=\{tokens\[scheme\]\[key\]\}/);
  assert.match(form, /onPatch\(tokenKey, hsl, scheme\)/);
  assert.doesNotMatch(form, /onPatch\(tokenKey, hsl, "light"\)/);
  assert.doesNotMatch(form, /tokens\.light\[key\]/);
});

test("look form tabs are named and KeepBar sits after both modes", () => {
  const form = read("components/identity-look-form.tsx");
  assert.match(form, /TabsList aria-label=\{copy\.label\}/);
  assert.match(form, /afterForm/);
  assert.doesNotMatch(form, /afterSimple/);
});

test("catalog view imports the host after search-first lead and filters", () => {
  const view = read("ui/catalog/catalog-view.tsx");
  assert.match(view, /\{catalogCopy\.header\.lead\}/);
  assert.match(view, /CatalogFiltersToolbar/);
  assert.match(view, /CatalogIdentity/);
  const leadAt = view.indexOf("{catalogCopy.header.lead}");
  const toolbarAt = view.indexOf("<CatalogFiltersToolbar");
  const hostAt = view.indexOf("<CatalogIdentity");
  assert.equal(leadAt >= 0 && toolbarAt >= 0 && hostAt >= 0, true);
  assert.equal(leadAt < toolbarAt, true);
  assert.equal(toolbarAt < hostAt, true);
});

test("the demo editor and the catalog host share IdentityLookForm", () => {
  const panel = read("components/identity-editor-panel.tsx");
  const host = read("ui/catalog/catalog-identity.tsx");
  const fields = read("components/identity-editor-fields.tsx");
  assert.match(panel, /IdentityLookForm/);
  assert.match(host, /IdentityLookForm/);
  assert.match(panel, /defaultMode="expert"/);
  assert.match(panel, /bindLookLibrary/);
  assert.match(host, /bindLookLibrary/);
  assert.match(fields, /identityTokenCssVars/);
  assert.doesNotMatch(fields, /identityEditorCopy\.fields\.scalar/);
});
