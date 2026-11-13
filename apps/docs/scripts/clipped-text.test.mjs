import assert from "node:assert/strict";
import test from "node:test";

import { clippedTextHits } from "./clipped-text.mjs";

const box = (over = {}) => ({
  tag: "P",
  className: "",
  text: "",
  overflowX: "visible",
  overflowY: "visible",
  textOverflow: "clip",
  scrollWidth: 100,
  clientWidth: 100,
  scrollHeight: 20,
  clientHeight: 20,
  allowClip: false,
  ...over,
});

test("hidden overflow past client + 1px is a hit; 1px tolerance is not", () => {
  assert.deepEqual(
    clippedTextHits([
      box({ overflowX: "hidden", scrollWidth: 102, clientWidth: 100 }),
    ]).map((hit) => hit.kind),
    ["overflow"],
  );
  assert.deepEqual(
    clippedTextHits([box({ overflowX: "hidden", scrollWidth: 101, clientWidth: 100 })]),
    [],
  );
  assert.deepEqual(
    clippedTextHits([
      box({ overflowY: "clip", scrollHeight: 22, clientHeight: 20 }),
    ]).map((hit) => hit.kind),
    ["overflow"],
  );
});

test("intended scroll regions and pre/code are not clipped-text hits", () => {
  assert.deepEqual(
    clippedTextHits([
      box({ overflowX: "auto", scrollWidth: 400, clientWidth: 100 }),
      box({ overflowY: "scroll", scrollHeight: 400, clientHeight: 20 }),
      box({
        tag: "DIV",
        overflowX: "hidden",
        overflowY: "hidden",
        scrollViewport: true,
        scrollHeight: 4041,
        clientHeight: 732,
      }),
      box({ tag: "PRE", overflowX: "hidden", scrollWidth: 400, clientWidth: 100 }),
      box({ tag: "CODE", overflowX: "hidden", scrollWidth: 400, clientWidth: 100 }),
    ]),
    [],
  );
});

test("html and body are ignored even when they overflow", () => {
  assert.deepEqual(
    clippedTextHits([
      box({ tag: "HTML", overflowX: "hidden", scrollWidth: 500, clientWidth: 100 }),
      box({ tag: "BODY", overflowY: "hidden", scrollHeight: 500, clientHeight: 20 }),
    ]),
    [],
  );
});

test("computed line-clamp and native inputs are not clipped-text hits", () => {
  assert.deepEqual(
    clippedTextHits([
      box({
        tag: "P",
        className: "home-metadata-copy",
        overflowX: "hidden",
        overflowY: "hidden",
        lineClamp: "2",
        scrollHeight: 50,
        clientHeight: 34,
        text: "Result helpers and tryCatch",
      }),
      box({
        tag: "INPUT",
        overflowX: "clip",
        overflowY: "clip",
        scrollWidth: 725,
        clientWidth: 289,
        text: "Set up zedkit AI",
      }),
    ]),
    [],
  );
});

test("truncate and line-clamp ellipsis pass; a heading ellipsis fails", () => {
  assert.deepEqual(
    clippedTextHits([
      box({
        className: "truncate",
        overflowX: "hidden",
        textOverflow: "ellipsis",
        scrollWidth: 400,
        clientWidth: 100,
      }),
      box({
        className: "line-clamp-2",
        overflowY: "hidden",
        textOverflow: "ellipsis",
        scrollHeight: 80,
        clientHeight: 40,
      }),
      box({
        allowClip: true,
        overflowX: "hidden",
        textOverflow: "ellipsis",
        scrollWidth: 400,
        clientWidth: 100,
      }),
    ]),
    [],
  );
  assert.deepEqual(
    clippedTextHits([
      box({
        tag: "H1",
        className: "hero-title",
        text: "Welcome to the docs",
        textOverflow: "ellipsis",
        scrollWidth: 400,
        clientWidth: 100,
      }),
    ]),
    [{ kind: "ellipsis", tag: "H1", locator: "hero-title Welcome to the docs" }],
  );
});

test("bare ellipsis CSS with no overflow is not a clipped-text hit", () => {
  assert.deepEqual(
    clippedTextHits([
      box({
        tag: "SPAN",
        className: "min-w-0",
        textOverflow: "ellipsis",
        scrollWidth: 100,
        clientWidth: 100,
      }),
    ]),
    [],
  );
});

test("an empty metrics list is not a hit", () => {
  assert.deepEqual(clippedTextHits([]), []);
});

test("overflow on a visible axis is not a clipped-text hit", () => {
  assert.deepEqual(
    clippedTextHits([
      box({ overflowX: "hidden", overflowY: "visible", scrollWidth: 100, clientWidth: 100, scrollHeight: 80, clientHeight: 20 }),
    ]),
    [],
  );
});

test("sr-only, clip/clip-path hide, and 1x1 boxes are not clipped-text hits", () => {
  assert.deepEqual(
    clippedTextHits([
      box({
        tag: "A",
        className: "sr-only focus:not-sr-only",
        text: "Skip to content",
        overflowX: "hidden",
        overflowY: "hidden",
        clip: "rect(0px, 0px, 0px, 0px)",
        clientWidth: 1,
        clientHeight: 1,
        scrollWidth: 80,
        scrollHeight: 16,
      }),
      box({
        tag: "SPAN",
        className: "sr-only",
        text: "Copy Anchor Link",
        overflowX: "hidden",
        overflowY: "hidden",
        clientWidth: 1,
        clientHeight: 1,
        scrollWidth: 90,
        scrollHeight: 1,
      }),
      box({
        tag: "SPAN",
        className: "visually-hidden",
        overflowX: "hidden",
        overflowY: "hidden",
        clip: "rect(0, 0, 0, 0)",
        scrollWidth: 200,
        clientWidth: 120,
      }),
      box({
        tag: "SPAN",
        overflowX: "hidden",
        overflowY: "hidden",
        clipPath: "inset(50%)",
        scrollWidth: 200,
        clientWidth: 120,
      }),
      box({
        tag: "I",
        overflowX: "hidden",
        overflowY: "hidden",
        clipPath: "circle(0)",
        scrollWidth: 40,
        clientWidth: 20,
      }),
    ]),
    [],
  );
});

test("a real clipped overflow is still a hit", () => {
  assert.deepEqual(
    clippedTextHits([
      box({
        tag: "P",
        className: "hero-lead",
        text: "This line is cut off",
        overflowX: "hidden",
        scrollWidth: 400,
        clientWidth: 100,
      }),
    ]),
    [{ kind: "overflow", tag: "P", locator: "hero-lead This line is cut off" }],
  );
});

test("not-sr-only and a 1px-wide tall clip still fail when they overflow", () => {
  assert.deepEqual(
    clippedTextHits([
      box({
        tag: "SPAN",
        className: "not-sr-only",
        overflowX: "hidden",
        scrollWidth: 200,
        clientWidth: 100,
        text: "visible copy",
      }),
    ]),
    [{ kind: "overflow", tag: "SPAN", locator: "not-sr-only visible copy" }],
  );
  assert.deepEqual(
    clippedTextHits([
      box({
        tag: "DIV",
        overflowX: "hidden",
        overflowY: "hidden",
        clientWidth: 1,
        clientHeight: 40,
        scrollWidth: 80,
        scrollHeight: 40,
        text: "pipe",
      }),
    ]),
    [{ kind: "overflow", tag: "DIV", locator: "pipe" }],
  );
});
