import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const demos = join(dirname(fileURLToPath(import.meta.url)), "../components/demos");

const { promptInputCopy } = await import("../components/demos/i18n/prompt-input-copy.ts");
const { scrollGalleryCopy } = await import("../components/demos/i18n/scroll-gallery-copy.ts");
const { stickyAsideCopy } = await import("../components/demos/i18n/sticky-aside-copy.ts");
const { surfaceCopy } = await import("../components/demos/i18n/surface-copy.ts");

function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (typeof value === "function" || value == null) {
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

function assertNoLeftovers(fileName, phrases) {
  const source = readFileSync(join(demos, fileName), "utf8");
  for (const phrase of phrases) {
    assert.equal(source.includes(phrase), false, `${fileName} still contains ${JSON.stringify(phrase)}`);
  }
}

test("prompt-input catalog locks the demo English", () => {
  assert.equal(promptInputCopy.sendLabel, "Send");
  assert.equal(promptInputCopy.messageAriaLabel, "Message");
  assert.equal(promptInputCopy.simple.placeholder, "Ask anything");
  assert.equal(promptInputCopy.simple.idleHint, "Enter sends, Shift+Enter adds a line.");
  assert.equal(promptInputCopy.simple.sentLine("hello"), "Sent: hello");
  assert.equal(promptInputCopy.complete.draft, "A calm studio site");
  assert.equal(promptInputCopy.complete.cancelLabel, "Stop");
  assert.equal(promptInputCopy.complete.waiting, "Waiting for a reply. Stop cancels.");
  assert.equal(promptInputCopy.complete.idleHint, "Send to see the busy state.");
});

test("scroll-gallery catalog locks the demo English", () => {
  assert.equal(scrollGalleryCopy.looksAriaLabel, "Looks");
  assert.equal(scrollGalleryCopy.lookLabels.one, "One");
  assert.equal(scrollGalleryCopy.lookLabels.two, "Two");
  assert.equal(scrollGalleryCopy.lookLabels.three, "Three");
  assert.equal(scrollGalleryCopy.lookLabels.four, "Four");
  assert.equal(scrollGalleryCopy.lookLabels.five, "Five");
  assert.equal(scrollGalleryCopy.chips.alpha, "Alpha");
  assert.equal(scrollGalleryCopy.chips.beta, "Beta");
  assert.equal(scrollGalleryCopy.chips.gamma, "Gamma");
  assert.equal(scrollGalleryCopy.chips.delta, "Delta");
});

test("sticky-aside catalog locks the demo English", () => {
  assert.equal(stickyAsideCopy.example.steps[0].title, "Install the package");
  assert.equal(stickyAsideCopy.example.steps[0].body, "Add the UI kit to your app.");
  assert.equal(stickyAsideCopy.example.steps[1].title, "Import the styles");
  assert.equal(stickyAsideCopy.example.steps[1].body, "Pull in the kit CSS once in your globals.");
  assert.equal(stickyAsideCopy.example.steps[2].title, "Render a control");
  assert.equal(stickyAsideCopy.example.steps[2].body, "Use a primitive in your page.");
  assert.equal(stickyAsideCopy.example.stepLabel(1), "Step 1");
  assert.equal(stickyAsideCopy.example.stepLabel(2), "Step 2");
  assert.equal(stickyAsideCopy.example.stepLabel(3), "Step 3");
  assert.equal(stickyAsideCopy.example.renderedExample, "Rendered example");
  assert.equal(stickyAsideCopy.example.save, "Save");
  assert.equal(stickyAsideCopy.docSteps.title, "Write the guide");
  assert.equal(stickyAsideCopy.docSteps.body, "Steps stay in the main column for reading order.");
  assert.equal(
    stickyAsideCopy.docSteps.summary,
    "Summary or preview — sticks while the section scrolls; pass scrollable when this block is taller than the viewport.",
  );
});

test("surface catalog locks the demo English", () => {
  assert.equal(surfaceCopy.solid.label, "Solid panel");
  assert.equal(surfaceCopy.solid.description, "Border, card fill, and shadow-md from one Surface.");
  assert.equal(surfaceCopy.glass.label, "Glass panel");
  assert.equal(surfaceCopy.glass.description, "Frosted under the glass identity; solid popover elsewhere.");
  assert.equal(surfaceCopy.widgetTrigger, "Widget trigger");
});

test("demo copy catalogs stay keys-only with no markup", () => {
  const catalogs = [promptInputCopy, scrollGalleryCopy, stickyAsideCopy, surfaceCopy];
  const strings = [
    ...catalogs.flatMap((catalog) => collectStrings(catalog)),
    promptInputCopy.simple.sentLine("hello"),
    stickyAsideCopy.example.stepLabel(1),
  ];
  for (const text of strings) {
    assert.doesNotMatch(text, /<\/?|&nbsp;/);
  }
});

test("prompt-input demo imports its catalog and drops leftover English", () => {
  const source = readFileSync(join(demos, "prompt-input-demo.tsx"), "utf8");
  assert.match(source, /@\/components\/demos\/i18n\/prompt-input-copy/);
  assertNoLeftovers("prompt-input-demo.tsx", [
    "Send",
    "Ask anything",
    "Message",
    "Stop",
    "A calm studio site",
    "Enter sends, Shift+Enter adds a line.",
    "Waiting for a reply. Stop cancels.",
    "Send to see the busy state.",
    "Sent:",
  ]);
});

test("scroll-gallery demo imports its catalog and drops leftover English", () => {
  const source = readFileSync(join(demos, "scroll-gallery-demo.tsx"), "utf8");
  assert.match(source, /@\/components\/demos\/i18n\/scroll-gallery-copy/);
  assert.match(source, /href="#alpha"/);
  assert.match(source, /"one"/);
  assertNoLeftovers("scroll-gallery-demo.tsx", [
    "Looks",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
  ]);
});

test("sticky-aside demo imports its catalog and drops leftover English", () => {
  const source = readFileSync(join(demos, "sticky-aside-demo.tsx"), "utf8");
  assert.match(source, /@\/components\/demos\/i18n\/sticky-aside-copy/);
  assertNoLeftovers("sticky-aside-demo.tsx", [
    "Install the package",
    "Add the UI kit to your app.",
    "Import the styles",
    "Pull in the kit CSS once in your globals.",
    "Render a control",
    "Use a primitive in your page.",
    "Step {",
    "Rendered example",
    "Save",
    "Write the guide",
    "Steps stay in the main column for reading order.",
    "Summary or preview —",
  ]);
});

test("surface demo imports its catalog and drops leftover English", () => {
  const source = readFileSync(join(demos, "surface-demo.tsx"), "utf8");
  assert.match(source, /@\/components\/demos\/i18n\/surface-copy/);
  assertNoLeftovers("surface-demo.tsx", [
    "Solid panel",
    "Border, card fill, and shadow-md from one Surface.",
    "Glass panel",
    "Frosted under the glass identity; solid popover elsewhere.",
    "Widget trigger",
  ]);
});
