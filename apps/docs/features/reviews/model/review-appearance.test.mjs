import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

// node --test does not read tsconfig `@/` paths; register the codec's alias first.
const defaultIdentityUrl = new URL("../../../lib/default-identity.ts", import.meta.url).href;
register(
  `data:text/javascript,${encodeURIComponent(`
    export async function resolve(specifier, context, nextResolve) {
      if (specifier !== "@/lib/default-identity") return nextResolve(specifier, context);
      return nextResolve(${JSON.stringify(defaultIdentityUrl)}, context);
    }
  `)}`,
  import.meta.url,
);

const {
  DEFAULT_REVIEW_APPEARANCE,
  compactPreviewSpacing,
  hasReviewAppearanceQuery,
  parseReviewAppearance,
  serializeReviewAppearance,
} = await import("./review-appearance.ts");

test("appearance round-trips identity, dark preview, and compact density", () => {
  const appearance = { identity: "volt", mode: "dark", density: "compact" };
  const query = serializeReviewAppearance(appearance);
  assert.equal(query, "identity=volt&preview=dark&density=compact");
  assert.deepEqual(parseReviewAppearance(`?${query}`), appearance);
});

test("canonical form omits glass, light, and default density", () => {
  assert.equal(serializeReviewAppearance(DEFAULT_REVIEW_APPEARANCE), "");
  assert.deepEqual(parseReviewAppearance(""), DEFAULT_REVIEW_APPEARANCE);
  assert.deepEqual(parseReviewAppearance("identity=glass&preview=light&density=default"), DEFAULT_REVIEW_APPEARANCE);
  assert.equal(serializeReviewAppearance(parseReviewAppearance("identity=glass&preview=dark")), "preview=dark");
});

test("preview=dark and legacy theme=dark both parse as dark", () => {
  assert.equal(parseReviewAppearance("preview=dark").mode, "dark");
  assert.equal(parseReviewAppearance("theme=dark").mode, "dark");
});

test("unknown identity and hostile query values fall back without throwing", () => {
  assert.equal(parseReviewAppearance("identity=n-custom").identity, "glass");
  assert.equal(parseReviewAppearance("identity=<script>").identity, "glass");
  assert.equal(parseReviewAppearance("density=comfortable").density, "default");
  assert.equal(parseReviewAppearance("preview=DARK").mode, "light");
  assert.doesNotThrow(() => parseReviewAppearance(`identity=${"x".repeat(4000)}&preview=${"\0"}`));
  assert.deepEqual(parseReviewAppearance("identity=tide&bogus=1&density=compact"), {
    identity: "tide",
    mode: "light",
    density: "compact",
  });
});

test("appearance codec still ignores unknown keys including item", () => {
  assert.deepEqual(parseReviewAppearance("identity=volt&item=agent-review"), {
    identity: "volt",
    mode: "light",
    density: "default",
  });
  assert.equal(serializeReviewAppearance(parseReviewAppearance("identity=volt&item=agent-review")), "identity=volt");
});

test("hasReviewAppearanceQuery is true only when an appearance key is present", () => {
  assert.equal(hasReviewAppearanceQuery(""), false);
  assert.equal(hasReviewAppearanceQuery("?"), false);
  assert.equal(hasReviewAppearanceQuery("item=agent-review"), false);
  assert.equal(hasReviewAppearanceQuery("foo=1&bar=2"), false);
  assert.equal(hasReviewAppearanceQuery("identity=volt"), true);
  assert.equal(hasReviewAppearanceQuery("preview=dark"), true);
  assert.equal(hasReviewAppearanceQuery("theme=dark"), true);
  assert.equal(hasReviewAppearanceQuery("density=compact"), true);
  assert.equal(hasReviewAppearanceQuery("?identity=glass"), true);
  assert.equal(hasReviewAppearanceQuery("foo=1&density=default"), true);
});

test("a single appearance key pins the rest to codec defaults", () => {
  assert.equal(hasReviewAppearanceQuery("identity="), true);
  assert.deepEqual(parseReviewAppearance("identity="), DEFAULT_REVIEW_APPEARANCE);
  assert.deepEqual(parseReviewAppearance("density=compact"), {
    identity: "glass",
    mode: "light",
    density: "compact",
  });
});

test("compactPreviewSpacing scales Nunit tokens and keeps unparsed input", () => {
  assert.equal(compactPreviewSpacing("1rem"), "0.85rem");
  assert.equal(compactPreviewSpacing("0.25rem"), `${0.25 * 0.85}rem`);
  assert.equal(compactPreviewSpacing("var(--spacing)"), "var(--spacing)");
  assert.equal(compactPreviewSpacing("1"), "1");
});
