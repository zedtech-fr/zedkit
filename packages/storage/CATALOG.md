# Catalog — @zedtech/zedkit-storage

- Keywords: s3, object-storage, presigned-url, typescript, server
- Audience: Node services that upload or serve files through S3-compatible storage.
- Purpose: Validated config, safe object keys, presigned URLs, and upload response headers without a managed storage service in-package.
- Attribution: Original work by the same author.

## Load storage config and create a client

- Import: `@zedtech/zedkit-storage` — `loadStorageConfig`, `storageConfigSchema`, `StorageConfig`, `createS3Client`
- Wraps: `@aws-sdk/client-s3` (peer)
- Status: alpha
- Short name: StorageConfig
- Audience: Boot-time wiring in APIs and workers.
- Purpose: Fail fast on missing env vars; explicit access keys only (no default credential chain).
- When to use: Any service that talks to S3 or a compatible provider (MinIO, R2, etc.).
- When not to use: Browser uploads without a server — still need a backend to presign.

```ts
import { createS3Client, loadStorageConfig } from "@zedtech/zedkit-storage";
const config = loadStorageConfig();
const client = createS3Client(config);
```

## Sanitise keys and presign uploads

- Import: `@zedtech/zedkit-storage` — `sanitizeObjectKey`, `sanitizeFilename`, `presignPutUrl`, `presignGetUrl`, `headObject`, `PresignPutInput`, `PresignGetInput`
- Wraps: `@aws-sdk/s3-request-presigner` (peer)
- Status: alpha
- Short name: presignPutUrl
- Audience: Handlers that accept user filenames and return short-lived upload URLs.
- Purpose: Block `..` and control characters; optional `keyPrefix` from config.
- When to use: Direct-to-storage uploads from the browser or mobile app.
- When not to use: Public anonymous buckets without presigning — configure IAM separately.

```ts
import { presignPutUrl, sanitizeFilename } from "@zedtech/zedkit-storage";
const safe = sanitizeFilename(userName);
await presignPutUrl(client, config, { key: `${userId}/${safe}`, contentType: "image/png" });
```

## Public URLs and response headers

- Import: `@zedtech/zedkit-storage` — `buildPublicObjectUrl`, `immutableCacheControl`, `svgServingHeaders`
- Wraps: `(none)`
- Status: alpha
- Short name: buildPublicObjectUrl
- Audience: Apps serving fingerprinted assets or user SVG through a CDN base URL.
- Purpose: Build CDN URLs from config; ship cache and CSP defaults for SVG objects.
- When to use: After upload, when `STORAGE_PUBLIC_BASE_URL` points at your CDN.
- When not to use: Private objects — use presigned GET instead.

```ts
import { buildPublicObjectUrl, immutableCacheControl, svgServingHeaders } from "@zedtech/zedkit-storage";
buildPublicObjectUrl(config, "avatars/id.png");
```
