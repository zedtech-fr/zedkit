import { describe, expect, it } from "vitest";

import {
  consumeSseStream,
  isAssistantStreamStage,
  pullSseFrames,
  readAssistantStreamEvent,
} from "#index.js";

describe("pullSseFrames", () => {
  it("splits complete frames and leaves a partial rest", () => {
    const { frames, rest } = pullSseFrames(
      'event: status\ndata: {"stage":"reading-reference"}\n\nevent: text\ndata: {"delta":"Hel',
    );
    expect(frames).toEqual([{ event: "status", data: '{"stage":"reading-reference"}' }]);
    expect(rest).toBe('event: text\ndata: {"delta":"Hel');
  });

  it("ignores comment keep-alives", () => {
    const { frames } = pullSseFrames(': keepalive\n\nevent: text\ndata: {"delta":"Hi"}\n\n');
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
  });

  it("yields the same text frame from a CRLF buffer", () => {
    const { frames, rest } = pullSseFrames('event: text\r\ndata: {"delta":"Hi"}\r\n\r\n');
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
    expect(rest).toBe("");
  });

  it("yields the same text frame from a CR buffer", () => {
    const { frames, rest } = pullSseFrames('event: text\rdata: {"delta":"Hi"}\r\r');
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
    expect(rest).toBe("");
  });

  it("yields both frames from an LF event followed by a CRLF event", () => {
    const { frames } = pullSseFrames(
      'event: status\ndata: {"stage":"reading-reference"}\n\nevent: text\r\ndata: {"delta":"Hi"}\r\n\r\n',
    );
    expect(frames).toEqual([
      { event: "status", data: '{"stage":"reading-reference"}' },
      { event: "text", data: '{"delta":"Hi"}' },
    ]);
  });

  it("ignores a CRLF comment keep-alive", () => {
    const { frames } = pullSseFrames(': keepalive\r\n\r\nevent: text\r\ndata: {"delta":"Hi"}\r\n\r\n');
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
  });

  it("ignores a CR comment keep-alive", () => {
    const { frames } = pullSseFrames(': keepalive\r\revent: text\rdata: {"delta":"Hi"}\r\r');
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
  });

  it("dispatches on a blank line made of LF then CRLF", () => {
    const { frames, rest } = pullSseFrames('event: text\ndata: {"delta":"Hi"}\n\r\n');
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
    expect(rest).toBe("");
  });

  it("joins two CRLF data fields with a newline", () => {
    const { frames } = pullSseFrames("data: a\r\ndata: b\r\n\r\n");
    expect(frames).toEqual([{ event: "message", data: "a\nb" }]);
  });
});

describe("readAssistantStreamEvent", () => {
  it("reads each named event and drops unknown stages", () => {
    expect(readAssistantStreamEvent({ event: "status", data: '{"stage":"picking-palette"}' })).toEqual({
      type: "status",
      stage: "picking-palette",
    });
    expect(readAssistantStreamEvent({ event: "text", data: '{"delta":"Quiet "}' })).toEqual({
      type: "text",
      delta: "Quiet ",
    });
    expect(readAssistantStreamEvent({ event: "complete", data: '{"summary":"Done."}' })).toEqual({
      type: "complete",
      payload: { summary: "Done." },
    });
    expect(readAssistantStreamEvent({ event: "error", data: '{"error":"timeout"}' })).toEqual({
      type: "error",
      error: "timeout",
      payload: { error: "timeout" },
    });
    expect(readAssistantStreamEvent({ event: "status", data: '{"stage":"nope"}' })).toBeNull();
    expect(isAssistantStreamStage("building-preview")).toBe(true);
    expect(isAssistantStreamStage("writing")).toBe(false);
  });
});

describe("consumeSseStream", () => {
  it("delivers frames as bytes arrive", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('event: status\ndata: {"stage":"reading-reference"}\n\n'));
        controller.enqueue(enc.encode('event: text\ndata: {"delta":"From "}\n\n: keepalive\n\n'));
        controller.enqueue(enc.encode('event: complete\ndata: {"summary":"From the site."}\n\n'));
        controller.close();
      },
    });
    const events = [] as ReturnType<typeof readAssistantStreamEvent>[];
    const result = await consumeSseStream(stream, (frame) => {
      events.push(readAssistantStreamEvent(frame));
    });
    expect(result.ok).toBe(true);
    expect(events).toEqual([
      { type: "status", stage: "reading-reference" },
      { type: "text", delta: "From " },
      { type: "complete", payload: { summary: "From the site." } },
    ]);
  });

  it("delivers a CRLF frame when a chunk splits the blank line between CR and LF", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('event: text\r\ndata: {"delta":"Hi"}\r\n\r'));
        controller.enqueue(enc.encode("\n"));
        controller.close();
      },
    });
    const frames: { event: string; data: string }[] = [];
    const result = await consumeSseStream(stream, (frame) => {
      frames.push(frame);
    });
    expect(result.ok).toBe(true);
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
  });

  it("returns ok with no frames for an empty stream", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    const frames: { event: string; data: string }[] = [];
    const result = await consumeSseStream(stream, (frame) => {
      frames.push(frame);
    });
    expect(result.ok).toBe(true);
    expect(frames).toEqual([]);
  });

  it("returns ok with no frames for a comment-only stream", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode(": ping\n\n"));
        controller.close();
      },
    });
    const frames: { event: string; data: string }[] = [];
    const result = await consumeSseStream(stream, (frame) => {
      frames.push(frame);
    });
    expect(result.ok).toBe(true);
    expect(frames).toEqual([]);
  });

  it("delivers two complete CR events then ok", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('event: text\rdata: {"delta":"A"}\r\revent: text\rdata: {"delta":"B"}\r\r'));
        controller.close();
      },
    });
    const frames: { event: string; data: string }[] = [];
    const result = await consumeSseStream(stream, (frame) => {
      frames.push(frame);
    });
    expect(result.ok).toBe(true);
    expect(frames).toEqual([
      { event: "text", data: '{"delta":"A"}' },
      { event: "text", data: '{"delta":"B"}' },
    ]);
  });

  it("flushes an incomplete last LF event at end of stream", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('event: text\ndata: {"delta":"Hi"}'));
        controller.close();
      },
    });
    const frames: { event: string; data: string }[] = [];
    const result = await consumeSseStream(stream, (frame) => {
      frames.push(frame);
    });
    expect(result.ok).toBe(true);
    expect(frames).toEqual([{ event: "text", data: '{"delta":"Hi"}' }]);
  });
});
