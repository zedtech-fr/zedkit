import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMemoryLogger, createMemoryTracker } from "#index.js";
import { ObservabilityProvider, useLogger, useTracker } from "#react.js";

type Events = { ping: { ok: boolean } };

function Probe() {
  const logger = useLogger();
  const tracker = useTracker<Events>();
  logger.info("from-probe");
  tracker.capture("ping", { ok: true });
  return <span>ready</span>;
}

describe("ObservabilityProvider", () => {
  it("injects logger and tracker from props", () => {
    const { logger, entries } = createMemoryLogger();
    const { tracker, captured } = createMemoryTracker<Events>();
    render(
      <ObservabilityProvider logger={logger} tracker={tracker}>
        <Probe />
      </ObservabilityProvider>,
    );
    expect(screen.getByText("ready")).toBeTruthy();
    expect(entries.some((e) => e.message === "from-probe")).toBe(true);
    expect(captured).toEqual([{ event: "ping", properties: { ok: true } }]);
  });
});
