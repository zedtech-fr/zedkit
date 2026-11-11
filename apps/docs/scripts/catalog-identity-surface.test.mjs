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
  assert.match(host, /saveNamedIdentity/);
  assert.match(host, /IdentityEditorKeepBar/);
  assert.match(host, /IdentityLookForm/);
  assert.match(host, /defaultMode="simple"/);
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
  assert.match(fields, /identityTokenCssVars/);
  assert.doesNotMatch(fields, /identityEditorCopy\.fields\.scalar/);
});
