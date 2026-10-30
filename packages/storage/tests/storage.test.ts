import { describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createS3Client } from "#client.js";
import { loadStorageConfig } from "#config.js";
import { immutableCacheControl, svgServingHeaders } from "#headers.js";
import { headObject, presignGetUrl, presignPutUrl } from "#presign.js";
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

  it("maps an endpoint, a public base, and forcePathStyle false", () => {
    const out = loadStorageConfig({
      STORAGE_BUCKET: "b",
      STORAGE_REGION: "eu-west-1",
      STORAGE_ACCESS_KEY_ID: "key",
      STORAGE_SECRET_ACCESS_KEY: "sec",
      STORAGE_ENDPOINT: "https://minio.example",
      STORAGE_FORCE_PATH_STYLE: "false",
      STORAGE_PUBLIC_BASE_URL: "https://cdn.example.com",
    });
    expect(out).toMatchObject({
      endpoint: "https://minio.example",
      forcePathStyle: false,
      publicBaseUrl: "https://cdn.example.com",
    });
  });
});

describe("sanitizeObjectKey", () => {
  it("joins prefix and rejects traversal", () => {
    expect(sanitizeObjectKey("a/b.png", "uploads")).toBe("uploads/a/b.png");
    expect(() => sanitizeObjectKey("../etc/passwd", "uploads")).toThrow(/Invalid/);
  });

  it("keeps a key without a prefix and rejects empty or control characters", () => {
    expect(sanitizeObjectKey("a/b.png")).toBe("a/b.png");
    expect(sanitizeObjectKey("a/b.png", "")).toBe("a/b.png");
    expect(() => sanitizeObjectKey("")).toThrow(/Invalid/);
    expect(() => sanitizeObjectKey("a\nb")).toThrow(/Invalid/);
  });
});

describe("sanitizeFilename", () => {
  it("strips path segments", () => {
    expect(sanitizeFilename("../../x.svg")).toBe("x.svg");
  });

  it("rejects empty names and traversal", () => {
    expect(() => sanitizeFilename("")).toThrow(/Invalid/);
    expect(() => sanitizeFilename("..")).toThrow(/Invalid/);
  });
});

describe("createS3Client", () => {
  it("returns an S3 client with explicit credentials", () => {
    const client = createS3Client(config);
    expect(client).toBeInstanceOf(S3Client);
  });

  it("passes endpoint and path-style when set", async () => {
    const client = createS3Client({
      ...config,
      endpoint: "https://minio.example",
      forcePathStyle: true,
    });
    expect(client.config.forcePathStyle).toBe(true);
    expect((await client.config.endpoint?.())?.hostname).toBe("minio.example");
  });
});

describe("presignPutUrl", () => {
  it("uses the prefixed key", async () => {
    const send = vi.fn();
    const client = { send, config: {} } as never;
    const url = await presignPutUrl(client, config, { key: "pic.png", contentType: "image/png" });
    expect(url).toBe("https://signed.example/put");
    expect(getSignedUrl).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ input: expect.objectContaining({ ContentType: "image/png" }) }),
      { expiresIn: 900 },
    );
  });

  it("omits ContentType and uses a custom expiry when those are not the defaults", async () => {
    const client = { send: vi.fn(), config: {} } as never;
    await presignPutUrl(client, config, { key: "pic.png", expiresInSeconds: 60 });
    expect(getSignedUrl).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ input: { Bucket: "assets", Key: "uploads/pic.png" } }),
      { expiresIn: 60 },
    );
  });
});

describe("presignGetUrl", () => {
  it("signs a get url with the prefixed key", async () => {
    const client = { send: vi.fn(), config: {} } as never;
    const url = await presignGetUrl(client, config, { key: "pic.png", expiresInSeconds: 30 });
    expect(url).toBe("https://signed.example/put");
    expect(getSignedUrl).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ input: { Bucket: "assets", Key: "uploads/pic.png" } }),
      { expiresIn: 30 },
    );
  });

  it("defaults get expiry to 900 seconds", async () => {
    const client = { send: vi.fn(), config: {} } as never;
    await presignGetUrl(client, config, { key: "pic.png" });
    expect(getSignedUrl).toHaveBeenCalledWith(client, expect.anything(), { expiresIn: 900 });
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

  it("strips a trailing slash on the base", () => {
    expect(buildPublicObjectUrl({ ...config, publicBaseUrl: "https://cdn.example.com/" }, "a.png")).toBe(
      "https://cdn.example.com/uploads/a.png",
    );
  });

  it("rejects a missing public base url", () => {
    expect(() => buildPublicObjectUrl({ ...config, publicBaseUrl: undefined }, "a.png")).toThrow(
      /publicBaseUrl is not configured/,
    );
  });
});

describe("headers", () => {
  it("exports immutable cache and svg CSP defaults", () => {
    expect(immutableCacheControl()).toContain("immutable");
    expect(svgServingHeaders()["Content-Security-Policy"]).toContain("sandbox");
  });
});
