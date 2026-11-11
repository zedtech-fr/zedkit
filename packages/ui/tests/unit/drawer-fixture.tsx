import { vi } from "vitest";

/**
 * Vaul reads browser-only APIs at open time; stub the ones jsdom
 * lacks so open/close behaves (no layout is asserted). Called from
 * `beforeAll` in the suites that open a drawer.
 * Reset with `afterEach`/`finally`: a mid-test failure otherwise leaks
 * `innerWidth` and `matchMedia` into later tests. Axe on an open drawer
 * must scan `document.body` — the panel portals out of the render container.
 */
export function stubDrawerJsdom(matches = false): void {
  // Vaul captures the pointer on press; jsdom has no pointer capture.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: matches ? 390 : 1024,
  });
  window.matchMedia = (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}
