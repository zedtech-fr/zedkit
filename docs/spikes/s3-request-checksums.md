# Spike: S3 request checksum defaults (`WHEN_REQUIRED`)

Checked 2026-10-29 for [#626](https://github.com/zedtech-fr/zedkit/issues/626) (storage item).

## Question

Does the S3 client v3 default checksum behaviour break common S3-compatible endpoints, and should `@zedtech/zedkit-storage` set `requestChecksumCalculation` explicitly?

## Findings

| Topic | Result |
| --- | --- |
| SDK | S3 client v3 (peer of `@zedtech/zedkit-storage`; repo catalog pin) |
| Default (SDK 3.x) | Newer clients may calculate request checksums more aggressively; incompatible endpoints reject extra checksum headers on simple PUT/GET. |
| Kit factory | `createS3Client` sets `requestChecksumCalculation: "WHEN_REQUIRED"` so checksums are sent only when the operation requires them. |
| Presign path | `presignPutUrl` / `presignGetUrl` use the same client; no separate checksum override needed for browser uploads. |
| Real bucket | Full matrix across vendors needs live credentials; not run in CI. Docs + factory default are the go for alpha. |

## Verdict

**Go** — keep `WHEN_REQUIRED` in `createS3Client`; document in README (already there). No code change required for this spike; optional follow-up is a mocked integration test if we add a dev-only spike script later.

## References

- Package: `packages/storage/src/client.ts`, `packages/storage/README.md`
- Vendor docs: request checksum calculation modes (`WHEN_REQUIRED` vs `WHEN_SUPPORTED`) in the S3 client v3 developer guide.
