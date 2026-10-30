import "reflect-metadata";
import { HttpException, Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AllExceptionsFilter, type ErrorBody } from "../src/index.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function catchWith(exception: unknown, id: unknown = "req-1"): { status: number; body: ErrorBody; header: string | undefined } {
  vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  const filter = new AllExceptionsFilter();
  let status = 0;
  let header: string | undefined;
  let body: ErrorBody | undefined;
  const reply = {
    sent: false,
    header(_name: string, value: string) {
      header = value;
    },
    status(code: number) {
      status = code;
      return {
        send(next: ErrorBody) {
          body = next;
        },
      };
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ id, method: "GET", url: "/" }),
      getResponse: () => reply,
    }),
  };
  filter.catch(exception, host as never);
  return { status, body: body as ErrorBody, header };
}

describe("AllExceptionsFilter", () => {
  it("maps Fastify body-parser codes to structured 4xx bodies", () => {
    expect(catchWith({ code: "FST_ERR_CTP_BODY_TOO_LARGE" })).toEqual({
      status: 413,
      header: "req-1",
      body: { code: "payload_too_large", message: "body exceeds the configured limit", requestId: "req-1" },
    });
    expect(catchWith({ code: "FST_ERR_CTP_INVALID_MEDIA_TYPE" })).toEqual({
      status: 415,
      header: "req-1",
      body: { code: "unsupported_media_type", message: "unsupported media type", requestId: "req-1" },
    });
    expect(catchWith({ code: "FST_ERR_CTP_EMPTY_JSON_BODY" })).toEqual({
      status: 400,
      header: "req-1",
      body: { code: "invalid_input", message: "invalid request body", requestId: "req-1" },
    });
  });

  it("keeps unknown Fastify codes and non-objects as an internal 500", () => {
    expect(catchWith({ code: "FST_ERR_NOT_FOUND" }).body).toEqual({
      code: "internal",
      message: "internal error",
      requestId: "req-1",
    });
    expect(catchWith("boom").status).toBe(500);
    expect(catchWith(null).status).toBe(500);
  });

  it("maps HttpException 4xx messages and 5xx public text", () => {
    expect(catchWith(new HttpException("nope", 401))).toMatchObject({
      status: 401,
      body: { code: "unauthorized", message: "nope", requestId: "req-1" },
    });
    expect(catchWith(new HttpException({ message: ["a", "b"] }, 400)).body).toMatchObject({
      code: "invalid_input",
      message: "a; b",
    });
    expect(catchWith(new HttpException({ message: 1 }, 409)).body).toMatchObject({
      code: "conflict",
      message: "Http Exception",
    });
    expect(catchWith(new HttpException("hidden", 503))).toMatchObject({
      status: 503,
      body: { code: "unavailable", message: "service unavailable", requestId: "req-1" },
    });
    expect(catchWith(new HttpException("hidden", 502))).toMatchObject({
      status: 502,
      body: { code: "http_502", message: "internal error", requestId: "req-1" },
    });
  });

  it("names the request unknown when the id is not a string", () => {
    expect(catchWith(new Error("x"), 12).body.requestId).toBe("unknown");
  });
});
