import { tryCatch, tryCatchAsync } from "@zedtech/zedkit-core";
import { type ReactElement, act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UpdatedAgo, ZedkitUiProvider, zedkitUiMessagesFr } from "#index.js";

function hydrationMessages(logs: unknown[][]): string[] {
  return logs
    .map((args) => args.map(String).join(" "))
    .filter((msg) => /hydrat|did not match|#418|#423|#425/i.test(msg));
}

const HOUR = 3_600_000;
const DAY = 86_400_000;
const THEN = Date.UTC(2026, 10, 7, 12, 0, 0);
const BUILD_NOW = THEN + 4 * DAY;

afterEach(() => {
  vi.restoreAllMocks();
});

async function hydrateStamp(tree: ReactElement, ssrNow: number, hydrateNow: number) {
  const nowSpy = vi.spyOn(Date, "now");
  nowSpy.mockReturnValue(ssrNow);

  const windowDesc = Object.getOwnPropertyDescriptor(globalThis, "window");
  const origError = console.error;
  const ssr = tryCatch(() => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: undefined });
    return renderToString(tree);
  });
  if (windowDesc) Object.defineProperty(globalThis, "window", windowDesc);
  if (!ssr.ok) throw ssr.error;

  nowSpy.mockReturnValue(hydrateNow);

  const container = document.createElement("div");
  container.innerHTML = ssr.value;
  document.body.appendChild(container);

  const recoverable: unknown[] = [];
  const logs: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    logs.push(args);
    origError.apply(console, args);
  };

  let root: ReturnType<typeof hydrateRoot> | undefined;
  const hydrated = tryCatchAsync(async () => {
    await act(async () => {
      root = hydrateRoot(container, tree, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
  });
  const done = await hydrated;
  console.error = origError;
  const text = container.textContent;
  root?.unmount();
  container.remove();
  if (!done.ok) throw done.error;

  return {
    html: ssr.value,
    text,
    hydration: hydrationMessages(logs),
    recoverable,
  };
}

describe("UpdatedAgo hydration", () => {
  it("hydrates a day-bucket clock shift without a markup mismatch, then shows the live relative time", async () => {
    const result = await hydrateStamp(<UpdatedAgo date={THEN} />, BUILD_NOW, BUILD_NOW + 2 * DAY);
    expect(result.html).toContain("Nov 7, 2026");
    expect(result.hydration).toEqual([]);
    expect(result.recoverable).toEqual([]);
    expect(result.text).toBe("Updated 6 days ago");
  });

  it("hydrates an hour-bucket clock shift without a markup mismatch, then shows the live relative time", async () => {
    const then = BUILD_NOW - 2 * HOUR;
    const result = await hydrateStamp(<UpdatedAgo date={then} />, BUILD_NOW, BUILD_NOW + 3 * HOUR);
    expect(result.hydration).toEqual([]);
    expect(result.recoverable).toEqual([]);
    expect(result.text).toBe("Updated 5 hours ago");
  });

  it("hydrates French messages without a markup mismatch, then shows a French relative time", async () => {
    const tree = (
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <UpdatedAgo date={THEN} />
      </ZedkitUiProvider>
    );
    const result = await hydrateStamp(tree, BUILD_NOW, BUILD_NOW + 2 * DAY);
    expect(result.html).toContain("7 nov. 2026");
    expect(result.hydration).toEqual([]);
    expect(result.recoverable).toEqual([]);
    expect(result.text).toBe("Mis à jour il y a 6 jours");
  });

  it("keeps a custom prefix on the post-mount relative string", async () => {
    const result = await hydrateStamp(
      <UpdatedAgo date={THEN} prefix="Synced" />,
      BUILD_NOW,
      BUILD_NOW + 2 * DAY,
    );
    expect(result.hydration).toEqual([]);
    expect(result.recoverable).toEqual([]);
    expect(result.text).toBe("Synced 6 days ago");
  });
});
