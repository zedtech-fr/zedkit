import assert from "node:assert/strict";
import test from "node:test";

import { clippedTextHits } from "./clipped-text.mjs";

const box = (over = {}) => ({
  tag: "P",
  className: "",
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
        textOverflow: "ellipsis",
        scrollWidth: 400,
        clientWidth: 100,
      }),
    ]).map((hit) => hit.kind),
    ["ellipsis"],
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
