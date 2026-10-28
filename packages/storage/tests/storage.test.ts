import { describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";

import { createS3Client } from "#client.js";
import { loadStorageConfig } from "#config.js";
import { immutableCacheControl, svgServingHeaders } from "#headers.js";
import { headObject, presignPutUrl } from "#presign.js";
import { buildPublicObjectUrl } from "#public-url.js";
import { sanitizeFilename, sanitizeObjectKey } from "#sanitize-key.js";

const config = {
  bucket: "assets",
  region: "eu-west-1",
  accessKeyId: "AKIAEXAMPLE",
  secretAccessKey: "secret",
  keyPrefix: "uploads",
  publicBaseUrl: "https://cdn.example.com",
};

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/put"),
}));

describe("loadStorageConfig", () => {
  it("requires explicit credentials", () => {
    expect(() =>
      loadStorageConfig({
        STORAGE_BUCKET: "b",
        STORAGE_REGION: "eu-west-1",
      }),
    ).toThrow(/Invalid storage environment/);
  });

  it("maps environment variables", () => {
    const out = loadStorageConfig({
      STORAGE_BUCKET: "b",
      STORAGE_REGION: "eu-west-1",
      STORAGE_ACCESS_KEY_ID: "key",
      STORAGE_SECRET_ACCESS_KEY: "sec",
      STORAGE_FORCE_PATH_STYLE: "true",
      STORAGE_KEY_PREFIX: "files",
    });
    expect(out).toMatchObject({
      bucket: "b",
      region: "eu-west-1",
      accessKeyId: "key",
      secretAccessKey: "sec",
      forcePathStyle: true,
      keyPrefix: "files",
    });
  });
});

describe("sanitizeObjectKey", () => {
  it("joins prefix and rejects traversal", () => {
    expect(sanitizeObjectKey("a/b.png", "uploads")).toBe("uploads/a/b.png");
    expect(() => sanitizeObjectKey("../etc/passwd", "uploads")).toThrow(/Invalid/);
  });
});

describe("sanitizeFilename", () => {
  it("strips path segments", () => {
    expect(sanitizeFilename("../../x.svg")).toBe("x.svg");
  });
});

describe("createS3Client", () => {
  it("returns an S3 client with explicit credentials", () => {
    const client = createS3Client(config);
    expect(client).toBeInstanceOf(S3Client);
  });
});

describe("presignPutUrl", () => {
  it("uses the prefixed key", async () => {
    const send = vi.fn();
    const client = { send, config: {} } as never;
    const url = await presignPutUrl(client, config, { key: "pic.png", contentType: "image/png" });
    expect(url).toBe("https://signed.example/put");
  });
});

describe("headObject", () => {
  it("sends HeadObjectCommand with prefixed key", async () => {
    const send = vi.fn(async () => ({ ContentLength: 1 }));
    const client = { send } as never;
    await headObject(client, config, "pic.png");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { Bucket: "assets", Key: "uploads/pic.png" },
      }),
    );
  });
});

describe("buildPublicObjectUrl", () => {
  it("encodes path segments", () => {
    expect(buildPublicObjectUrl(config, "a/b.png")).toBe("https://cdn.example.com/uploads/a/b.png");
  });
});

describe("headers", () => {
  it("exports immutable cache and svg CSP defaults", () => {
    expect(immutableCacheControl()).toContain("immutable");
    expect(svgServingHeaders()["Content-Security-Policy"]).toContain("sandbox");
  });
});
