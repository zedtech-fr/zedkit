import { describe, expect, it } from "vitest";
import { createProductAnalyticsTracker } from "#posthog-tracker.js";

type Events = { signed_up: { source: string } };

describe("createProductAnalyticsTracker", () => {
  it("forwards identify and capture to the client", () => {
    const calls: string[] = [];
    const client = {
      identify: (id: string) => calls.push(`id:${id}`),
      capture: (event: string) => calls.push(`cap:${event}`),
      reset: () => calls.push("reset"),
    };
    const tracker = createProductAnalyticsTracker<Events>(client);
    tracker.identify("u1");
    tracker.capture("signed_up", { source: "web" });
    tracker.reset();
    expect(calls).toEqual(["id:u1", "cap:signed_up", "reset"]);
  });
});
