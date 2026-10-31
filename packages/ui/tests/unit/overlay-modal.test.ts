import { describe, expect, it } from "vitest";
import { resolveModalMountAutoFocus } from "#overlay-modal.js";

describe("overlay modal mount autofocus", () => {
  it("defaults to modal when autoFocus is omitted", () => {
    expect(resolveModalMountAutoFocus(undefined, true)).toBe(true);
    expect(resolveModalMountAutoFocus(undefined, false)).toBe(false);
  });

  it("honors an explicit autoFocus override", () => {
    expect(resolveModalMountAutoFocus(false, true)).toBe(false);
    expect(resolveModalMountAutoFocus(true, false)).toBe(true);
  });
});
